import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Loader2, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { trackEvent } from "@/lib/analytics";

export default function PartnerPaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

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
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          {verifying ? (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                Activating your listing...
              </h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment and set up your partner listing.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Trusted Services Partner
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground" data-testid="text-payment-success">
                Welcome to {platform.name} Trusted Services
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {verified
                  ? "Your subscription is active and your business listing is now live in our Trusted Services directory. Veterans in your area can connect with you directly."
                  : "Your payment has been received. Your listing will be activated shortly. If it doesn't appear within a few minutes, please contact us."}
              </p>

              {verified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Next Step: Create Your Partner Account</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Set up your account to access your Partner Portal — where you can track leads, refer businesses to earn free months, and manage your listing.
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                {verified && (
                  <Button
                    data-testid="button-create-partner-account"
                    onClick={() => setLocation("/partner-portal?setup=1")}
                  >
                    Create My Account
                  </Button>
                )}
                <Button
                  data-testid="button-view-listing"
                  variant={verified ? "outline" : "default"}
                  onClick={() => setLocation("/discounts")}
                >
                  View Trusted Services
                </Button>
                <Button
                  data-testid="button-manage-billing"
                  variant="outline"
                  disabled={portalLoading}
                  onClick={openCustomerPortal}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Manage Billing
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
