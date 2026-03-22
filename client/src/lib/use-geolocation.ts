import { useState, useEffect, useCallback, useRef } from "react";

interface GeoLocation {
  state: string;
  stateCode: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
}

export interface GeoDebugLog {
  ts: number;
  msg: string;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: (force?: boolean) => void;
  hasPermission: boolean | null;
  permDenied: boolean;
  debugLog: GeoDebugLog[];
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
  const pendingRef = useRef(false);
  const [permDenied, setPermDenied] = useState(false);
  const [debugLog, setDebugLog] = useState<GeoDebugLog[]>([]);

  const log = useCallback((msg: string) => {
    console.log(`[GEO] ${msg}`);
    setDebugLog(prev => [...prev.slice(-29), { ts: Date.now(), msg }]);
  }, []);

  const fetchLocation = useCallback((force?: boolean) => {
    log(`fetchLocation called, force=${!!force}, permDenied=${permDenied}`);

    if (!navigator.geolocation) {
      log("ERROR: Geolocation API not supported");
      setError("Geolocation is not supported");
      return;
    }

    if (!force) {
      const cached = getCachedLocation();
      if (cached) {
        log(`Cache hit: lat=${cached.lat.toFixed(2)}, lng=${cached.lng.toFixed(2)}, city=${cached.city}, state=${cached.stateCode}`);
        setLocation(cached);
        setError(null);
        setHasPermission(true);
        setPermDenied(false);
        return;
      }
      log("Cache miss");
      if (permDenied) {
        log("BLOCKED: permDenied=true, not retrying GPS. User must fix in device settings.");
        return;
      }
    } else {
      clearCachedLocation();
      log("Cache cleared (force)");
    }

    if (pendingRef.current) {
      log("SKIPPED: request already pending");
      return;
    }
    pendingRef.current = true;
    setLoading(true);
    setError(null);
    log("Calling getCurrentPosition...");

    const startTime = Date.now();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const elapsed = Date.now() - startTime;
        pendingRef.current = false;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        log(`GPS success in ${elapsed}ms: lat=${lat.toFixed(4)}, lng=${lng.toFixed(4)}, accuracy=${Math.round(acc)}m`);

        try {
          log("Calling reverseGeocode...");
          const result = await reverseGeocode(lat, lng);
          const geoElapsed = Date.now() - startTime;
          log(`reverseGeocode done in ${geoElapsed}ms: city=${result.city}, state=${result.stateCode}`);
          setCachedLocation(result);
          setLocation(result);
          setHasPermission(true);
          setPermDenied(false);
          setError(null);
          log("Location state UPDATED");
        } catch (e) {
          log(`reverseGeocode FAILED: ${e}. Using raw coords.`);
          const fallback = { state: "", stateCode: "", city: "", zip: "", lat, lng };
          setLocation(fallback);
          setCachedLocation(fallback);
          setHasPermission(true);
          setError(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const elapsed = Date.now() - startTime;
        pendingRef.current = false;
        const reason = err.code === 1 ? "PERMISSION_DENIED" : err.code === 2 ? "POSITION_UNAVAILABLE" : err.code === 3 ? "TIMEOUT" : `UNKNOWN(${err.code})`;
        log(`GPS FAILED in ${elapsed}ms: ${reason} — ${err.message}`);
        if (err.code === 1) {
          setPermDenied(true);
          log("permDenied=true (device-level block detected)");
        }
        setHasPermission(false);
        setError(
          err.code === 1
            ? "Location permission denied"
            : "Could not get your location"
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 }
    );
  }, [log, permDenied]);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      log(`Mount: cache found, lat=${cached.lat.toFixed(2)}, lng=${cached.lng.toFixed(2)}`);
      setLocation(cached);
      setHasPermission(true);
      setError(null);
      return;
    }

    log("Mount: no cache");
    const hasPermAPI = "permissions" in navigator;
    log(`Mount: navigator.permissions exists=${hasPermAPI}`);

    if (hasPermAPI) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        log(`Permissions API: state=${result.state}`);
        setHasPermission(result.state === "granted");
        if (result.state === "granted") {
          log("Permissions API: granted, auto-fetching");
          fetchLocation();
        }
        result.onchange = () => {
          const granted = result.state === "granted";
          log(`Permissions onchange: state=${result.state}`);
          setHasPermission(granted);
          if (granted) {
            setError(null);
            fetchLocation(true);
          }
        };
      }).catch((e) => {
        log(`Permissions API REJECTED: ${e}. Safari detected — waiting for user action.`);
      });
    } else {
      log("Mount: no Permissions API — waiting for user action");
    }
  }, [fetchLocation, log]);

  return { location, loading, error, requestLocation: fetchLocation, hasPermission, permDenied, debugLog };
}
