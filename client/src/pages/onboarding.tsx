import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { useSavedResources } from "@/lib/store";
import AuthModal from "@/components/auth-modal";

const REVERSE_GEOCODE_URL = "https://nominatim.openstreetmap.org/reverse";

const INTEREST_OPTIONS = [
  "Benefits & VA Claims",
  "Healthcare",
  "Mental Health",
  "Housing Support",
  "Employment",
  "Education & GI Bill",
  "Legal & Financial",
  "Family & Caregivers",
  "Military Records",
  "Transition",
  "Crisis Help",
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locStatus, setLocStatus] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const { setInterests, completeOnboarding, setLocation: setStoreLocation } = useSavedResources();

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const advanceFromLocation = () => {
    setLocLoading(false);
    setTimeout(() => setStep(4), 1200);
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
            `${REVERSE_GEOCODE_URL}?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const stateCode = addr.state_code?.toUpperCase() || addr["ISO3166-2-lvl4"]?.split("-")[1] || "";
          const state = addr.state || "";
          const city = addr.city || addr.town || addr.village || "";
          const zip = addr.postcode || "";
          if (stateCode || city) {
            setStoreLocation(stateCode, state, city, zip);
            setLocStatus(`Location set: ${city ? city + ", " : ""}${stateCode}`);
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

  const finish = () => {
    setInterests(selectedInterests);
    completeOnboarding();
    setLocation("/home");
  };

  const handleAuthSuccess = () => {
    completeOnboarding();
    setLocation("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">

        {step === 1 && (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="h-48 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
              <img src={logoImg} alt="Veteran Care Logo" className="h-full w-full object-contain" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-primary">
                Welcome to Veteran Care
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                Helping veterans find benefits, housing, healthcare, and local support.
              </p>
            </div>

            <div className="w-full space-y-2 pt-4">
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
              <img src={logoImg} alt="Veteran Care Logo" className="h-full w-full object-contain" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-primary">
                Create Your Free Account
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                Sign up for a personalized experience with saved resources, tailored recommendations, and direct support.
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
              <img src={logoImg} alt="Veteran Care Logo" className="h-full w-full object-contain" />
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
                Allow location so we can show veteran resources and services near you.
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
                onClick={() => setStep(4)}
                disabled={locLoading}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full flex flex-col items-center">
            <div className="h-32 w-full max-w-[200px] flex items-center justify-center drop-shadow-2xl mb-2">
              <img src={logoImg} alt="Veteran Care Logo" className="h-full w-full object-contain" />
            </div>

            <div className="space-y-1 mb-4 text-center">
              <h1 className="text-xl font-heading font-extrabold tracking-tight text-primary">
                What do you need help with today?
              </h1>
              <p className="text-muted-foreground text-xs leading-relaxed px-4">
                Select all that apply. You can change these later.
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mb-4">
              {INTEREST_OPTIONS.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <div
                    key={item}
                    data-testid={`interest-${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center space-x-2 border p-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleInterest(item)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="h-4 w-4 shrink-0"
                      onCheckedChange={() => toggleInterest(item)}
                    />
                    <Label className="cursor-pointer font-medium text-xs leading-tight">
                      {item}
                    </Label>
                  </div>
                );
              })}
            </div>

            <div className="w-full pt-1">
              <Button
                data-testid="button-continue-to-app"
                className="w-full h-11 text-base font-bold rounded-full shadow-lg"
                onClick={finish}
              >
                Continue to App <ArrowRight className="h-4 w-4 ml-2" />
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
