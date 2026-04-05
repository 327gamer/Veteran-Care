import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Loader2, CreditCard, ExternalLink, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/lib/use-auth";
import PartnerSignupModal from "@/components/partner-signup-modal";

export default function PartnerPaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { session } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState<string | null>(null);
  const [showPartnerSignup, setShowPartnerSignup] = useState(false);

  useEffect(() => {
    if (verified && session?.access_token) {
      fetch("/api/partner/role-check", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.isPartner) {
            setTimeout(() => setLocation("/partner-portal"), 1500);
          }
        })
        .catch(() => {});
    }
  }, [verified, session?.access_token, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setVerifying(false);
      return;
    }
    setCheckoutSessionId(sessionId);

    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const success = data.status === "activated" || data.status === "already_active";
        setVerified(success);
        if (data.email) setPartnerEmail(data.email);
        if (success) trackEvent("partner_stripe_success");
        setVerifying(false);
      })
      .catch(() => {
        setVerifying(false);
      });
  }, []);

  const openCustomerPortal = async () => {
    if (!checkoutSessionId) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalLoading(false);
      }
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 px-5 space-y-4">
          {verifying ? (
            <>
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
              </div>
              <h2 className="text-lg font-heading font-bold text-foreground">
                Activating your listing...
              </h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment and set up your partner listing.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trusted Services Partner
              </div>
              <h2 className="text-lg font-heading font-bold text-foreground" data-testid="text-payment-success">
                Welcome to {platform.name} Trusted Services
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {verified
                  ? "Your subscription is active and your business listing is now live. Veterans in your area can connect with you directly."
                  : "Your payment has been received. Your listing will be activated shortly."}
              </p>

              {verified && !session && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Next Step: Create Your Account</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Set up your {platform.name} account to access your Partner Dashboard — track leads, refer businesses, and earn free months.
                  </p>
                </div>
              )}

              {verified && session && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-sm font-semibold text-green-900">You're signed in! Redirecting to your dashboard...</p>
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-2">
                {verified && !session && (
                  <Button
                    data-testid="button-create-partner-account"
                    className="w-full h-10 rounded-full"
                    onClick={() => setShowPartnerSignup(true)}
                  >
                    Create My Account
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    data-testid="button-view-listing"
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => setLocation("/discounts")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View Trusted Services
                  </Button>
                  <Button
                    data-testid="button-manage-billing"
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    disabled={portalLoading}
                    onClick={openCustomerPortal}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                    )}
                    Manage Billing
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PartnerSignupModal
        open={showPartnerSignup}
        onOpenChange={setShowPartnerSignup}
        prefillEmail={partnerEmail || ""}
        stripeSessionId={checkoutSessionId || undefined}
        onSuccess={() => setLocation("/partner-portal")}
      />
    </div>
  );
}
