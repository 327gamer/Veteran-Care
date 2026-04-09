import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import {
  Copy,
  Check,
  Gift,
  Trophy,
  ChevronRight,
  ArrowLeft,
  Crown,
  Medal,
  MessageSquare,
  Phone,
  Send,
  Star,
  Mail,
  Building2,
  LogOut,
  FileText,
  CreditCard,
  ShieldCheck,
  Globe,
  MapPin,
  Tag,
  User,
  Percent,
  Image,
  Pencil,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { platform } from "@shared/platform";
import { useAuth } from "@/lib/use-auth";
import PartnerSignupModal from "@/components/partner-signup-modal";

interface PartnerReferralData {
  partnerId: string;
  companyName: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  signedUp: number;
  freeMonthsEarned: number;
  pendingRewards: number;
  rank: number | null;
}

interface LeaderboardEntry {
  rank: number;
  companyName: string;
  referrals: number;
}

interface PartnerProfile {
  id: string;
  email: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  category_name?: string;
  subcategory_names?: string[];
  plan_type?: string;
  status: string;
  stripe_subscription_id?: string;
  converted_provider_id?: string;
  offer_title?: string;
  offer_description?: string;
  banner_image_url?: string;
  offer_expiry?: string;
}

function partnerFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "border-amber-300/60 bg-amber-50/40";
  if (rank === 2) return "border-slate-300/60 bg-slate-50/40";
  if (rank === 3) return "border-amber-600/30 bg-amber-50/20";
  return "";
}

export default function PartnerPortal() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const accessToken = session?.access_token;

  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [view, setView] = useState<"dashboard" | "referrals" | "leaderboard" | "offer">("dashboard");
  const [msgVariant, setMsgVariant] = useState(0);
  const [showPartnerSignup, setShowPartnerSignup] = useState(false);
  const [partnerSignupMode, setPartnerSignupMode] = useState<"signup" | "login">("login");

  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [offerSaving, setOfferSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [offerMsg, setOfferMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStorage.getItem("partner_token")) {
      localStorage.removeItem("partner_token");
      localStorage.removeItem("partner_company");
    }
    if (sessionStorage.getItem("partner_referral_email")) {
      sessionStorage.removeItem("partner_referral_email");
    }
  }, []);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<PartnerProfile>({
    queryKey: ["/api/partner/me", accessToken],
    queryFn: async () => {
      const r = await partnerFetch("/api/partner/me", accessToken!);
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: "Failed" }));
        throw new Error(body.error || "Not a partner");
      }
      return r.json();
    },
    enabled: !!accessToken,
    retry: false,
  });

  const { data: refData, isLoading: refLoading } = useQuery<PartnerReferralData>({
    queryKey: ["/api/partner-referral/me", accessToken],
    queryFn: async () => {
      const r = await partnerFetch("/api/partner-referral/me", accessToken!);
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: "Request failed" }));
        throw new Error(body.error || "Request failed");
      }
      return r.json();
    },
    enabled: !!accessToken && !!profile,
    retry: false,
  });

  const { data: lbData, isLoading: lbLoading } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ["/api/partner-referral/leaderboard"],
    queryFn: () => fetch("/api/partner-referral/leaderboard").then((r) => r.json()),
    enabled: view === "leaderboard",
  });

  const { data: billingData } = useQuery<any[]>({
    queryKey: ["/api/partner/lead-billing", accessToken],
    queryFn: async () => {
      const r = await partnerFetch("/api/partner/lead-billing", accessToken!);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!accessToken && !!profile,
  });

  const shareMessages = [
    (link: string) => `We've partnered with ${platform.name} to help veterans connect with trusted services. If your business works with veterans or wants to, I highly recommend checking this out: ${link}`,
    (link: string) => `I'm a Trusted Partner with ${platform.name}, and it's been a great way to reach veterans who need our services. If you're looking for a verified platform to connect with the military community, take a look: ${link}`,
    (link: string) => `Interested in reaching more veterans through your business? Check out the ${platform.name} Trusted Partner program: ${link}`,
  ];

  const shareLabels = ["Friendly", "Professional", "Direct"];

  const getShareMessage = () => {
    if (!refData?.referralLink) return "";
    return shareMessages[msgVariant](refData.referralLink);
  };

  const handleCopy = async () => {
    if (!refData?.referralLink) return;
    try { await navigator.clipboard.writeText(refData.referralLink); } catch {
      const input = document.createElement("input");
      input.value = refData.referralLink;
      document.body.appendChild(input); input.select(); document.execCommand("copy"); document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    const msg = getShareMessage();
    if (!msg) return;
    try { await navigator.clipboard.writeText(msg); } catch {
      const input = document.createElement("textarea");
      input.value = msg;
      document.body.appendChild(input); input.select(); document.execCommand("copy"); document.body.removeChild(input);
    }
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2000);
  };

  const handleSms = () => {
    const msg = getShareMessage();
    if (msg) window.open(`sms:?&body=${encodeURIComponent(msg)}`, "_self");
  };

  const handleEmail = () => {
    const msg = getShareMessage();
    if (msg) window.open(`mailto:?subject=${encodeURIComponent(`Join ${platform.name} as a Trusted Partner`)}&body=${encodeURIComponent(msg)}`, "_self");
  };

  const handleWhatsApp = () => {
    const msg = getShareMessage();
    if (msg) window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSignOut = async () => {
    await signOut();
    queryClient.removeQueries({ queryKey: ["/api/partner/me"] });
    queryClient.removeQueries({ queryKey: ["/api/partner-referral/me"] });
  };

  useEffect(() => {
    if (profile && view === "offer") {
      setOfferTitle(profile.offer_title || "");
      setOfferDescription(profile.offer_description || "");
      setOfferExpiry(profile.offer_expiry ? profile.offer_expiry.split("T")[0] : "");
      setBannerPreview(profile.banner_image_url || null);
      setOfferMsg(null);
    }
  }, [profile, view]);

  const handleSaveOffer = async () => {
    if (!accessToken) return;
    setOfferSaving(true);
    setOfferMsg(null);
    try {
      const r = await partnerFetch("/api/partner/offer", accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          offer_title: offerTitle.trim() || null,
          offer_description: offerDescription.trim() || null,
          offer_expiry: offerExpiry || null,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: "Save failed" }));
        throw new Error(body.error || "Save failed");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      setOfferMsg({ type: "success", text: "Offer details saved!" });
    } catch (e: any) {
      setOfferMsg({ type: "error", text: e.message || "Failed to save offer" });
    } finally {
      setOfferSaving(false);
    }
  };

  const compressImage = (file: File, maxWidth = 1200, maxHeight = 600, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
        if (h > maxHeight) { w = Math.round(w * (maxHeight / h)); h = maxHeight; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  };

  const handleBannerUpload = async (file: File) => {
    if (!accessToken) return;
    if (file.size > 10 * 1024 * 1024) {
      setOfferMsg({ type: "error", text: "Image is too large. Please choose a smaller photo." });
      return;
    }
    setBannerSaving(true);
    setOfferMsg(null);
    try {
      const dataUrl = await compressImage(file);
      setBannerPreview(dataUrl);
      const r = await partnerFetch("/api/partner/banner", accessToken, {
        method: "PATCH",
        body: JSON.stringify({ banner_image_url: dataUrl }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error || "Upload failed");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      setOfferMsg({ type: "success", text: "Banner image uploaded!" });
    } catch (e: any) {
      setOfferMsg({ type: "error", text: e.message || "Failed to upload banner" });
    } finally {
      setBannerSaving(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!accessToken) return;
    setBannerSaving(true);
    setOfferMsg(null);
    try {
      const r = await partnerFetch("/api/partner/banner", accessToken, {
        method: "PATCH",
        body: JSON.stringify({ banner_image_url: null }),
      });
      if (!r.ok) throw new Error("Failed to remove banner");
      setBannerPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      setOfferMsg({ type: "success", text: "Banner removed" });
    } catch (e: any) {
      setOfferMsg({ type: "error", text: e.message || "Failed to remove banner" });
    } finally {
      setBannerSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button
          data-testid="link-back-to-home-partner-portal"
          onClick={() => setLocation("/home")}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 data-testid="text-partner-portal-title" className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Partner Portal
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Log in to access your partner dashboard, referral tools, and lead activity.
          </p>
          <Button
            data-testid="button-partner-login-cta"
            className="rounded-full px-8"
            onClick={() => { setPartnerSignupMode("login"); setShowPartnerSignup(true); }}
          >
            Log In
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-8"
            onClick={() => { setPartnerSignupMode("signup"); setShowPartnerSignup(true); }}
          >
            Create Account
          </Button>
          <p className="text-xs text-muted-foreground">
            Not a partner yet?{" "}
            <button onClick={() => setLocation("/partner-apply")} className="text-primary underline font-medium">
              Apply to become a Trusted Partner
            </button>
          </p>
        </div>
        <PartnerSignupModal
          open={showPartnerSignup}
          onOpenChange={setShowPartnerSignup}
          defaultMode={partnerSignupMode}
        />
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    const errorMsg = (profileError as any)?.message || "";
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button onClick={() => setLocation("/home")} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
          <ArrowLeft className="h-4 w-4" />Back to Home
        </button>
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-amber-700" />
          </div>
          <h2 className="text-lg font-heading font-bold text-foreground">
            Partner Account Not Found
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {errorMsg.includes("not yet approved")
              ? "Your partner application is still under review. You'll be able to access the dashboard once approved."
              : `No active partner account was found for ${user.email}. Make sure you applied with this email and your application has been approved.`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/home")}>Go Home</Button>
            <Button onClick={() => setLocation("/partner-apply")}>Apply Now</Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "offer") {
    const hasListing = !!profile?.converted_provider_id;
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button data-testid="button-back-from-offer" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setView("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-primary">Manage Your Offer</h2>
            <p className="text-xs text-muted-foreground">Highlight a special deal on your listing</p>
          </div>
        </div>

        {!hasListing ? (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="p-4 text-center space-y-2">
              <Percent className="h-8 w-8 text-amber-600 mx-auto" />
              <p className="text-sm font-medium text-amber-800">Your listing hasn't been created yet</p>
              <p className="text-xs text-muted-foreground">Once your application is fully approved, you'll be able to add a special offer and banner image to your listing.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {offerMsg && (
              <div data-testid="text-offer-message" className={`text-sm px-3 py-2 rounded-lg ${offerMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {offerMsg.text}
              </div>
            )}

            <Card data-testid="card-offer-form" className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-primary" />
                  Offer Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="offer-title" className="text-xs font-medium">Offer Title</Label>
                    <Input
                      id="offer-title"
                      data-testid="input-offer-title"
                      placeholder="e.g. 20% Off First Visit"
                      value={offerTitle}
                      onChange={(e) => setOfferTitle(e.target.value)}
                      maxLength={100}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="offer-description" className="text-xs font-medium">Offer Description</Label>
                    <Textarea
                      id="offer-description"
                      data-testid="input-offer-description"
                      placeholder="Describe your offer — what veterans get and any conditions"
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="text-sm resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{offerDescription.length}/500</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="offer-expiry" className="text-xs font-medium">Expiry Date (optional)</Label>
                    <Input
                      id="offer-expiry"
                      data-testid="input-offer-expiry"
                      type="date"
                      value={offerExpiry}
                      onChange={(e) => setOfferExpiry(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    data-testid="button-save-offer"
                    className="w-full rounded-full"
                    onClick={handleSaveOffer}
                    disabled={offerSaving}
                  >
                    {offerSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Offer Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-banner-upload" className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Image className="h-4 w-4 text-primary" />
                  Banner Image
                </h3>
                <p className="text-xs text-muted-foreground">Upload any photo from your phone or computer. It will be automatically resized and optimized for your listing.</p>

                {bannerPreview ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        data-testid="img-banner-preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid="button-change-banner"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={bannerSaving}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />Change
                      </Button>
                      <Button
                        data-testid="button-remove-banner"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleRemoveBanner}
                        disabled={bannerSaving}
                      >
                        {bannerSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    data-testid="button-upload-banner"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={bannerSaving}
                    className="w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {bannerSaving ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">Tap to upload banner</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBannerUpload(file);
                    e.target.value = "";
                  }}
                />
              </CardContent>
            </Card>

            {(offerTitle || offerDescription || bannerPreview) && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</h3>
                  {bannerPreview && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={bannerPreview} alt="Banner" className="w-full h-24 object-cover" />
                    </div>
                  )}
                  {offerTitle && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                        <Percent className="h-3 w-3" />Special Offer
                      </span>
                    </div>
                  )}
                  {offerTitle && <p className="text-sm font-semibold text-foreground">{offerTitle}</p>}
                  {offerDescription && <p className="text-xs text-muted-foreground leading-relaxed">{offerDescription}</p>}
                  {offerExpiry && (
                    <p className="text-[10px] text-muted-foreground">Expires: {new Date(offerExpiry + "T00:00:00").toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  if (view === "leaderboard") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button data-testid="button-back-to-dashboard" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setView("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-primary">Partner Leaderboard</h2>
            <p className="text-xs text-muted-foreground">Top referring partners</p>
          </div>
        </div>
        {lbLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : lbData?.leaderboard?.length ? (
          <div className="space-y-2">
            {lbData.leaderboard.map((entry) => (
              <Card key={entry.rank} data-testid={`card-leaderboard-${entry.rank}`} className={getRankStyle(entry.rank)}>
                <CardContent className="px-4 py-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0 w-8"><RankIcon rank={entry.rank} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{entry.companyName}</p></div>
                  <p className="text-sm font-bold text-primary shrink-0">{entry.referrals}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">No referrals yet. Be the first!</p></CardContent></Card>
        )}
      </div>
    );
  }

  if (view === "referrals") {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button data-testid="button-back-from-referrals" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setView("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-primary">Refer a Business</h2>
            <p className="text-xs text-muted-foreground">Earn a free month for every qualified referral</p>
          </div>
        </div>

        {refLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : refData ? (
          <>
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Referral Link</label>
                  <div className="flex gap-2">
                    <div data-testid="text-partner-referral-link" className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground truncate border">{refData.referralLink}</div>
                    <Button data-testid="button-copy-partner-link" variant={copied ? "default" : "outline"} size="sm" className="shrink-0 h-auto px-4" onClick={handleCopy}>
                      {copied ? <><Check className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {shareLabels.map((label, i) => (
                      <button key={label} data-testid={`button-partner-msg-variant-${i}`} onClick={() => setMsgVariant(i)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${msgVariant === i ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-transparent hover:border-muted-foreground/20"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-3 py-2 border border-dashed">{getShareMessage() || "Loading..."}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <Button data-testid="button-partner-copy-message" variant="outline" size="sm" className="text-xs h-9" onClick={handleCopyMessage}>
                      {msgCopied ? <><Check className="h-3.5 w-3.5 mr-1" />Copied</> : <><MessageSquare className="h-3.5 w-3.5 mr-1" />Copy</>}
                    </Button>
                    <Button data-testid="button-partner-share-sms" variant="outline" size="sm" className="text-xs h-9" onClick={handleSms}><Phone className="h-3.5 w-3.5 mr-1" />SMS</Button>
                    <Button data-testid="button-partner-share-email" variant="outline" size="sm" className="text-xs h-9" onClick={handleEmail}><Mail className="h-3.5 w-3.5 mr-1" />Email</Button>
                    <Button data-testid="button-partner-share-whatsapp" variant="outline" size="sm" className="text-xs h-9" onClick={handleWhatsApp}><Send className="h-3.5 w-3.5 mr-1" />WA</Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "referrals", val: refData.totalReferrals, label: "Referrals" },
                    { key: "free-months", val: refData.freeMonthsEarned, label: "Free Mo." },
                    { key: "pending", val: refData.pendingRewards, label: "Pending" },
                    { key: "rank", val: refData.rank ?? "—", label: "Rank" },
                  ].map((s) => (
                    <div key={s.key} className="text-center p-3 rounded-lg bg-muted/30">
                      <p data-testid={`text-partner-${s.key}`} className="text-2xl font-bold text-primary">{s.val}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-center text-muted-foreground/60">Free months are earned when a referred business signs up and completes their first paid billing cycle.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-partner-leaderboard" className="cursor-pointer hover:border-primary/30 transition-colors group" onClick={() => setView("leaderboard")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">View Partner Leaderboard</p>
                  <p className="text-xs text-muted-foreground">See the top referring partners</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" />How It Works</h3>
                <ol className="text-xs text-muted-foreground space-y-1.5 ml-5 list-decimal">
                  <li>Share your unique referral link with businesses you know</li>
                  <li>They apply to become a {platform.name} Trusted Partner</li>
                  <li>Once approved, they activate a paid plan</li>
                  <li>After their first successful billing cycle is completed</li>
                  <li>You receive 100% off your next monthly invoice</li>
                </ol>
                <p className="text-[11px] text-muted-foreground/60 mt-2">One free month per qualified referral. Credit applies to a future invoice and cannot be exchanged for cash.</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Unable to load referral data.</p></CardContent></Card>
        )}
      </div>
    );
  }

  const companyName = profile.company_name || refData?.companyName || "Partner";
  const isActive = profile.status === "active" || profile.status === "approved";
  const pendingLeads = billingData?.filter((r: any) => r.status === "pending").length || 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button data-testid="link-back-to-home-partner-portal" onClick={() => setLocation("/home")} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
          <ArrowLeft className="h-4 w-4" />Back to Home
        </button>
        <button data-testid="button-partner-logout" onClick={handleSignOut} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-3.5 w-3.5" />Sign Out
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-extrabold text-primary tracking-tight">{companyName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              <ShieldCheck className="h-3 w-3" />
              {isActive ? "Active Partner" : "Pending"}
            </div>
          </div>
        </div>
      </div>

      <Card data-testid="card-business-profile" className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            Business Profile
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {profile.contact_name && (
              <div className="flex items-start gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact</p>
                  <p data-testid="text-bp-contact" className="text-sm font-medium text-foreground truncate">{profile.contact_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                <p data-testid="text-bp-email" className="text-sm font-medium text-foreground truncate">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p data-testid="text-bp-phone" className="text-sm font-medium text-foreground">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Website</p>
                  <p data-testid="text-bp-website" className="text-sm font-medium text-foreground truncate">{profile.website}</p>
                </div>
              </div>
            )}
            {profile.category_name && (
              <div className="flex items-start gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</p>
                  <p data-testid="text-bp-category" className="text-sm font-medium text-foreground">{profile.category_name}</p>
                  {profile.subcategory_names && profile.subcategory_names.length > 0 && (
                    <p data-testid="text-bp-subcategories" className="text-xs text-muted-foreground mt-0.5">{profile.subcategory_names.join(", ")}</p>
                  )}
                </div>
              </div>
            )}
            {(profile.city || profile.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Location</p>
                  <p data-testid="text-bp-location" className="text-sm font-medium text-foreground">
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}
            {profile.plan_type && (
              <div className="flex items-start gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan</p>
                  <p data-testid="text-bp-plan" className="text-sm font-medium text-foreground capitalize">{profile.plan_type}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <Card data-testid="card-manage-offer" className="cursor-pointer hover:border-primary/30 transition-colors group" onClick={() => setView("offer")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Percent className="h-5 w-5 text-purple-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Manage Offer & Banner</p>
              <p className="text-xs text-muted-foreground">
                {profile.offer_title ? profile.offer_title : "Add a special offer to your listing"}
              </p>
            </div>
            {profile.offer_title && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-700 shrink-0">
                <Check className="h-2.5 w-2.5" />Active
              </span>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
          </CardContent>
        </Card>

        <Card data-testid="card-referral-tools" className="cursor-pointer hover:border-primary/30 transition-colors group" onClick={() => setView("referrals")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Gift className="h-5 w-5 text-green-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Refer a Business</p>
              <p className="text-xs text-muted-foreground">Share your link & earn free months</p>
            </div>
            {refData && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">{refData.totalReferrals}</p>
                <p className="text-[10px] text-muted-foreground">referrals</p>
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
          </CardContent>
        </Card>

        <Card data-testid="card-lead-billing">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><FileText className="h-5 w-5 text-blue-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Lead Activity</p>
              <p className="text-xs text-muted-foreground">{billingData && billingData.length > 0 ? `${billingData.length} total leads` : "No leads yet"}</p>
            </div>
            {pendingLeads > 0 && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-blue-600">{pendingLeads}</p>
                <p className="text-[10px] text-muted-foreground">pending</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-partner-leaderboard-home" className="cursor-pointer hover:border-primary/30 transition-colors group" onClick={() => setView("leaderboard")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-amber-700" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Partner Leaderboard</p>
              <p className="text-xs text-muted-foreground">See top referring partners</p>
            </div>
            {refData?.rank && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-amber-600">#{refData.rank}</p>
                <p className="text-[10px] text-muted-foreground">your rank</p>
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
          </CardContent>
        </Card>
      </div>

      {billingData && billingData.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-primary" />Recent Lead Activity</h3>
            <div className="space-y-2">
              {billingData.slice(0, 5).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between text-xs border-b border-muted/40 pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{record.category_name || "Lead"}</p>
                    <p className="text-muted-foreground">{new Date(record.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(record.amount_cents / 100).toFixed(2)}</p>
                    <p className={`text-[10px] ${record.status === "pending" ? "text-amber-600" : record.status === "paid" ? "text-green-600" : "text-red-600"}`}>{record.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center pt-2">
        <p className="text-[11px] text-muted-foreground/50">Logged in as {user.email} · {platform.name} Trusted Partner</p>
      </div>
    </div>
  );
}
