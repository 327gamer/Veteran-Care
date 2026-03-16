import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";

export default function PartnerPaymentSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
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
            Your subscription is now active. Your business listing will appear in our Trusted Services directory
            and veterans in your area will be able to connect with you directly.
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
              View Trusted Services
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
