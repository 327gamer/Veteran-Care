import { useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/lib/use-geolocation";
import { useSavedResources } from "@/lib/store";

const SESSION_DISMISS_KEY = "vc-loc-prompt-dismissed";

interface EnableLocationPromptProps {
  variant?: "inline" | "card";
  className?: string;
}

export function EnableLocationPrompt({
  variant = "inline",
  className = "",
}: EnableLocationPromptProps) {
  const geo = useGeolocation();
  const userLocation = useSavedResources((s) => s.userLocation);
  // Synchronous lazy init prevents a one-frame flash of the prompt on first
  // paint after the user has already dismissed it earlier in this session.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  // A successful browser permission grant gives us coordinates immediately,
  // even when reverse-geocoding hasn't filled in city/state yet. Treat any
  // of {state, city, lat+lng, hasPermission===true, loading} as "user has
  // already engaged with location" so we never re-prompt or flash.
  const hasGeoFix = !!(
    geo.location &&
    (geo.location.state ||
      geo.location.city ||
      (Number.isFinite(geo.location.lat) && Number.isFinite(geo.location.lng)))
  );
  const hasManualLocation = !!(userLocation?.state || userLocation?.city);
  const permissionGranted = geo.hasPermission === true;
  const isResolving = geo.loading;
  const hasAnyLocation =
    hasGeoFix || hasManualLocation || permissionGranted || isResolving;

  if (hasAnyLocation || dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  const enable = () => {
    geo.requestLocation(true);
  };

  if (variant === "card") {
    return (
      <div
        data-testid="card-enable-location"
        className={`rounded-lg border border-primary/20 bg-primary/5 p-3 ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-0.5">
              Enable location for better results
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Enable location for better results and a more personalized experience.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                data-testid="button-enable-location"
                size="sm"
                className="h-7 text-xs"
                onClick={enable}
                disabled={geo.loading}
              >
                {geo.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <MapPin className="h-3 w-3 mr-1" />
                )}
                Enable Location
              </Button>
              <Button
                data-testid="button-dismiss-location-prompt"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={dismiss}
              >
                Not Now
              </Button>
            </div>
            {geo.permDenied && (
              <p
                data-testid="text-location-denied-hint"
                className="text-[10px] text-muted-foreground mt-1.5 leading-snug"
              >
                Location was previously blocked. Enable it in your browser
                settings, or enter your city/state manually below.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="banner-enable-location"
      className={`flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 ${className}`}
    >
      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground leading-snug flex-1">
        Enable location for better results and a more personalized experience.
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          data-testid="button-enable-location"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[11px]"
          onClick={enable}
          disabled={geo.loading}
        >
          {geo.loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Enable"
          )}
        </Button>
        <button
          data-testid="button-dismiss-location-prompt"
          onClick={dismiss}
          aria-label="Dismiss location prompt"
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
