import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";

export default function PartnerPaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setVerifying(false);
      return;
    }

    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setVerified(data.status === "activated" || data.status === "already_active");
        setVerifying(false);
      })
      .catch(() => {
        setVerifying(false);
      });
  }, []);

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
                Trusted Services & Products Partner
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground" data-testid="text-payment-success">
                Welcome to {platform.name} Trusted Services & Products
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {verified
                  ? "Your subscription is active and your business listing is now live in our Trusted Services & Products directory. Veterans in your area can connect with you directly."
                  : "Your payment has been received. Your listing will be activated shortly. If it doesn't appear within a few minutes, please contact us."}
              </p>
              <p className="text-xs text-muted-foreground">
                You will receive lead notifications at the email address on your application.
                For any questions, contact <a href="mailto:info@veterancare.com" className="text-primary underline">info@veterancare.com</a>.
              </p>
              <div className="pt-4">
                <Button
                  data-testid="button-view-listing"
                  onClick={() => setLocation("/trusted-services")}
                >
                  View Trusted Services & Products
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
