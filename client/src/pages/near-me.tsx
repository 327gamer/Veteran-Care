import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MenuPageHero from "@/components/menu-page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeolocation } from "@/lib/use-geolocation";
import {
  MapPin,
  Map as MapIcon,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

type Step = "choose" | "geo" | "manual";

export default function NearMe() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("choose");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const geo = useGeolocation();

  // On successful geolocation, jump straight to resources in nearme mode.
  useEffect(() => {
    if (step === "geo" && geo.location && geo.location.lat && geo.location.lng) {
      setLocation("/resources?mode=nearme");
    }
  }, [step, geo.location, setLocation]);

  // If geolocation is denied or errors, drop the user into the manual path
  // (per founder requirement: no silent fallback to national results).
  useEffect(() => {
    if (step === "geo" && (geo.permDenied || (geo.error && !geo.loading))) {
      setStep("manual");
    }
  }, [step, geo.permDenied, geo.error, geo.loading]);

  const { data: cities = [], isLoading: citiesLoading } = useQuery<string[]>({
    queryKey: ["/api/locations/cities", selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const r = await fetch(`/api/locations/cities?state=${selectedState}`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!selectedState && step === "manual",
  });

  const handleUseLocation = () => {
    setStep("geo");
    geo.requestLocation(true);
  };

  const handleViewResults = () => {
    const params = new URLSearchParams();
    if (selectedState) params.set("state", selectedState);
    if (selectedCity) params.set("city", selectedCity);
    setLocation(`/resources?${params.toString()}`);
  };

  const goBack = () => {
    setStep("choose");
    setSelectedCity("");
  };

  const stateLabel =
    US_STATES.find((s) => s.code === selectedState)?.name || "";

  return (
    <div className="bg-background min-h-full pb-24" data-testid="page-near-me">
      <MenuPageHero
        testIdPrefix="near"
        eyebrow="Find Help"
        title={["Near", "You"]}
        subtitle="How would you like to find resources?"
        detail="Use your location or pick a state and city. No account needed."
      />

      <section className="container mx-auto px-5 py-10 max-w-2xl">
        {step === "choose" && (
          <div className="space-y-4">
            <ChoiceTile
              testId="tile-use-location"
              icon={<MapPin className="h-7 w-7" />}
              title="Use My Location"
              detail="See resources closest to where you are right now."
              onClick={handleUseLocation}
            />
            <ChoiceTile
              testId="tile-pick-state"
              icon={<MapIcon className="h-7 w-7" />}
              title="Pick a State / City"
              detail="Choose any U.S. state, then narrow by city if you want."
              onClick={() => setStep("manual")}
            />
          </div>
        )}

        {step === "geo" && (
          <Card>
            <CardContent className="px-6 sm:px-10 py-12 text-center">
              <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-lg font-semibold mb-2">Getting your location…</p>
              <p className="text-sm text-muted-foreground">
                If you see a permission popup, tap "Allow." If you say no,
                we'll switch you to the manual state picker.
              </p>
              <Button
                variant="ghost"
                className="mt-6"
                onClick={goBack}
                data-testid="button-back-from-geo"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "manual" && (
          <Card>
            <CardContent className="px-6 sm:px-10 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-heading font-bold text-primary"
                  data-testid="text-manual-heading"
                >
                  Pick a State / City
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  data-testid="button-back-to-choices"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>

              {geo.permDenied && (
                <div
                  className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900"
                  data-testid="banner-geo-denied"
                >
                  Location was turned off, so we've switched you to manual
                  browsing. You can pick a state below.
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="select-state"
                  className="text-sm font-medium text-foreground"
                >
                  State
                </label>
                <Select
                  value={selectedState}
                  onValueChange={(v) => {
                    setSelectedState(v);
                    setSelectedCity("");
                  }}
                >
                  <SelectTrigger
                    id="select-state"
                    className="h-12 text-base"
                    data-testid="select-state"
                  >
                    <SelectValue placeholder="Choose a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="select-city"
                  className="text-sm font-medium text-foreground"
                >
                  City {step === "state" && <span className="text-muted-foreground font-normal">(optional)</span>}
                </label>
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  disabled={!selectedState || citiesLoading}
                >
                  <SelectTrigger
                    id="select-city"
                    className="h-12 text-base"
                    data-testid="select-city"
                  >
                    <SelectValue
                      placeholder={
                        !selectedState
                          ? "Choose a state first"
                          : citiesLoading
                          ? "Loading cities…"
                          : cities.length === 0
                          ? "No cities yet for this state"
                          : "Choose a city"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedState && (
                  <p
                    className="text-xs text-muted-foreground leading-snug"
                    data-testid="text-city-helper"
                  >
                    Showing {stateLabel} cities that currently have approved
                    resources on the platform.
                  </p>
                )}
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={!selectedState || (step === "city" && !selectedCity)}
                onClick={handleViewResults}
                data-testid="button-view-results"
              >
                View resources
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function ChoiceTile({
  icon,
  title,
  detail,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-card hover:bg-accent active:scale-[.99] transition-all rounded-xl border border-border shadow-sm hover:shadow-md p-5 sm:p-6 flex items-start gap-4"
      data-testid={testId}
    >
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold text-lg text-primary">{title}</div>
        <p className="text-sm text-muted-foreground mt-1 leading-snug">{detail}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground self-center flex-shrink-0" />
    </button>
  );
}
