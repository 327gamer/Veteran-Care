const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  geo_source: string;
}

let lastCallTime = 0;

export async function geocodeAddress(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): Promise<GeocodeResult | null> {
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length < 2) return null;

  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastCallTime = Date.now();

  try {
    const q = parts.join(", ");
    const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&countrycodes=us&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "VeteranCareApp/1.0 (admin-geocode)" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lon)) return null;

    return { latitude: lat, longitude: lon, geo_source: "nominatim" };
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
