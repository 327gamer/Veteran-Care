const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  geo_source: string;
}

let lastCallTime = 0;

async function rateLimitWait() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastCallTime = Date.now();
}

async function nominatimQuery(params: Record<string, string>): Promise<any[]> {
  await rateLimitWait();
  const searchParams = new URLSearchParams({ format: "json", countrycodes: "us", limit: "1", ...params });
  const url = `${NOMINATIM_URL}?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CareApp/1.0 (admin-geocode)" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function stripSuite(addr: string): string {
  return addr.replace(/[,\s]+(suite|ste|unit|apt|room|rm|bldg|building|floor|fl|#)\s*[a-z0-9\-]+\s*$/i, "").trim();
}

export async function geocodeAddress(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): Promise<GeocodeResult | null> {
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length < 2) return null;

  const cleanStreet = address ? stripSuite(address) : null;
  const hadSuite = cleanStreet !== address;

  const attempts: (() => Promise<any[]>)[] = [];

  if (cleanStreet && city && state) {
    attempts.push(() => {
      const p: Record<string, string> = { street: cleanStreet, city, state };
      if (zip) p.postalcode = zip;
      return nominatimQuery(p);
    });

    if (zip) {
      attempts.push(() => nominatimQuery({ street: cleanStreet, city, state }));
    }

    if (hadSuite) {
      attempts.push(() => {
        const p: Record<string, string> = { street: address!, city, state };
        if (zip) p.postalcode = zip;
        return nominatimQuery(p);
      });
    }
  }

  if (city && state) {
    attempts.push(() => {
      const p: Record<string, string> = { city, state };
      if (zip) p.postalcode = zip;
      return nominatimQuery(p);
    });

    if (zip) {
      attempts.push(() => nominatimQuery({ city, state }));
    }
  }

  if (state && zip && !city) {
    attempts.push(() => nominatimQuery({ state, postalcode: zip }));
  }

  if (attempts.length === 0 && parts.length >= 2) {
    attempts.push(() => nominatimQuery({ q: parts.join(", ") }));
  }

  try {
    for (const attempt of attempts) {
      const data = await attempt();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon, geo_source: "nominatim" };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
