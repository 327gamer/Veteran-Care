import { useState, useEffect, useCallback } from "react";

interface GeoLocation {
  state: string;
  stateCode: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: (force?: boolean) => void;
  hasPermission: boolean | null;
}

const STATE_NAME_TO_CODE: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY",
};

const CACHE_KEY = "vc-geo-cache";
const CACHE_TTL = 1000 * 60 * 60;

function getCachedLocation(): GeoLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  return null;
}

function clearCachedLocation() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

function setCachedLocation(data: GeoLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const data = await res.json();
      return {
        state: data.state || "",
        stateCode: data.stateCode || "",
        city: data.city || "",
        zip: data.zip || "",
        lat,
        lng,
      };
    }
  } catch {}
  return { state: "", stateCode: "", city: "", zip: "", lat, lng };
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(getCachedLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchLocation = useCallback((force?: boolean) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    if (!force) {
      const cached = getCachedLocation();
      if (cached) {
        setLocation(cached);
        return;
      }
    } else {
      clearCachedLocation();
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          setCachedLocation(result);
          setLocation(result);
          setHasPermission(true);
        } catch (e) {
          setError("Could not determine your location");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setHasPermission(false);
        setError(
          err.code === 1
            ? "Location permission denied"
            : "Could not get your location"
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      setLocation(cached);
      return;
    }

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setHasPermission(result.state === "granted");
        if (result.state === "granted") {
          fetchLocation();
        }
        result.onchange = () => {
          setHasPermission(result.state === "granted");
        };
      }).catch(() => {});
    }
  }, [fetchLocation]);

  return { location, loading, error, requestLocation: fetchLocation, hasPermission };
}
