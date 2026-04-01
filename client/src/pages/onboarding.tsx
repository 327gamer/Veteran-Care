import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, UserPlus } from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { platform } from "@shared/platform";
import { useSavedResources } from "@/lib/store";
import AuthModal from "@/components/auth-modal";

export default function Onboarding() {
  const search = useSearch();
  const initialStep = new URLSearchParams(search).get("step");
  const [step, setStep] = useState(initialStep === "2" ? 2 : 1);
  const [, setLocation] = useLocation();
  const [locLoading, setLocLoading] = useState(false);
  const [locStatus, setLocStatus] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const { completeOnboarding, setLocation: setStoreLocation } = useSavedResources();

  const enterApp = () => {
    completeOnboarding();
    setLocation("/home");
  };

  const advanceFromLocation = () => {
    setLocLoading(false);
    setTimeout(() => enterApp(), 1200);
  };

  const requestGeolocation = () => {
    setLocLoading(true);
    setLocStatus("Requesting location access...");

    let resolved = false;
    const resolve = () => {
      if (resolved) return;
      resolved = true;
    };

    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        resolve();
        setLocStatus("You can set your location anytime in the app.");
        advanceFromLocation();
      }
    }, 12000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        resolve();
        clearTimeout(safetyTimeout);
        setLocStatus("Finding your area...");
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) throw new Error("Geocode request failed");
          const { stateCode, state, city, zip } = await res.json();
          if (stateCode || state || city) {
            setStoreLocation(stateCode || "", state || "", city || "", zip || "");
            try {
              localStorage.setItem("vc-geo-cache", JSON.stringify({
                data: {
                  state: state || "",
                  stateCode: stateCode || "",
                  city: city || "",
                  zip: zip || "",
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                },
                ts: Date.now(),
              }));
            } catch {}
            const display = [city, stateCode || state].filter(Boolean).join(", ");
            setLocStatus(`Location set: ${display}`);
          } else {
            setLocStatus("You can set your location anytime in the app.");
          }
        } catch {
          setLocStatus("You can set your location anytime in the app.");
        }
        advanceFromLocation();
      },
      () => {
        resolve();
        clearTimeout(safetyTimeout);
        setLocStatus("You can set your location anytime in the app.");
        advanceFromLocation();
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleAllowLocation = async () => {
    if (!navigator.geolocation) {
      setLocStatus("You can set your location anytime in the app.");
      advanceFromLocation();
      return;
    }

    try {
      const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (perm.state === "denied") {
        setLocStatus("You can set your location anytime in the app.");
        advanceFromLocation();
        return;
      }
    } catch {}

    requestGeolocation();
  };

  const handleAuthSuccess = () => {
    completeOnboarding();
    setLocation("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 pt-8 pb-6 bg-background relative overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500 flex-1 justify-center">

        {step === 1 && (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="h-44 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
              <img src={logoImg} alt={platform.name} className="h-full w-full object-contain" />
            </div>

            <div>
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-primary">
                Welcome to {platform.name}
              </h1>
              <p className="text-lg font-semibold text-foreground/85 mt-2.5">
                {platform.onboardingPrimary}
              </p>
              <p className="text-sm text-muted-foreground mt-2.5 px-2">
                Get the help you need —
              </p>
              <p className="text-sm text-muted-foreground px-2">
                quickly, simply, and locally.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed px-2 mt-2.5 max-w-md mx-auto">
                {platform.onboardingBody}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed px-2 mt-3 italic">
                {platform.onboardingCta}
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <Button
                data-testid="button-get-started"
                className="w-full h-11 text-base font-bold rounded-full shadow-lg"
                onClick={() => setStep(2)}
              >
                Get Started
              </Button>
              <Button
                data-testid="button-have-account"
                variant="outline"
                className="w-full h-10 text-sm font-semibold rounded-full border-2"
                onClick={() => {
                  setShowAuth(true);
                }}
              >
                I Already Have an Account
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="h-36 w-full max-w-[220px] flex items-center justify-center drop-shadow-2xl">
              <img src={logoImg} alt={platform.name} className="h-full w-full object-contain" />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-primary">
                Create Your Free Account
              </h1>
              <p className="text-primary/80 text-sm font-semibold leading-relaxed px-2">
                {platform.onboardingAccountSubtitle}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed px-2">
                {platform.onboardingAccountBody}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed px-2 italic">
                {platform.onboardingAccountPrivacy}
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <Button
                data-testid="button-create-account"
                className="w-full h-11 text-base font-bold rounded-full shadow-lg"
                onClick={() => setShowAuth(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
              <Button
                data-testid="button-continue-guest"
                variant="ghost"
                className="w-full text-sm font-medium text-muted-foreground h-9"
                onClick={() => setStep(3)}
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="h-40 w-full max-w-[240px] flex items-center justify-center drop-shadow-2xl">
              <img src={logoImg} alt={platform.name} className="h-full w-full object-contain" />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary fill-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-primary">
                Enable Location
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                Allow location so we can show resources and services near you.
              </p>
            </div>

            {locStatus && (
              <p className="text-xs text-muted-foreground animate-in fade-in duration-300 px-4" data-testid="text-loc-status">
                {locStatus}
              </p>
            )}

            <div className="w-full space-y-2 pt-2">
              <Button
                data-testid="button-allow-location"
                className="w-full h-11 text-base font-bold rounded-full shadow-lg"
                onClick={handleAllowLocation}
                disabled={locLoading}
              >
                {locLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Locating...
                  </span>
                ) : (
                  "Allow Location"
                )}
              </Button>
              <Button
                data-testid="button-maybe-later"
                variant="ghost"
                className="w-full text-sm font-medium text-muted-foreground h-9"
                onClick={enterApp}
                disabled={locLoading}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        onSuccess={handleAuthSuccess}
        defaultMode={step === 1 ? "login" : "signup"}
      />
    </div>
  );
}
