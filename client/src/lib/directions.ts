export interface DirectionsLocation {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  name?: string | null;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function formatAddress(loc: DirectionsLocation): string {
  return [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(", ");
}

function hasCoords(loc: DirectionsLocation): boolean {
  return loc.latitude != null && loc.longitude != null &&
    !isNaN(loc.latitude) && !isNaN(loc.longitude);
}

export function hasDirectionsData(loc: DirectionsLocation): boolean {
  return hasCoords(loc) || !!formatAddress(loc);
}

export function getDirectionsUrl(loc: DirectionsLocation): string | null {
  const coords = hasCoords(loc) ? `${loc.latitude},${loc.longitude}` : null;
  const addr = formatAddress(loc);
  const destination = coords || addr;
  if (!destination) return null;

  const label = loc.name ? encodeURIComponent(loc.name) : "";

  if (isIOS()) {
    if (coords) {
      return `https://maps.apple.com/?daddr=${coords}&dirflg=d${label ? `&q=${label}` : ""}`;
    }
    return `https://maps.apple.com/?daddr=${encodeURIComponent(addr)}&dirflg=d`;
  }

  if (isAndroid()) {
    if (coords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  }

  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}

export function openDirections(loc: DirectionsLocation): void {
  const url = getDirectionsUrl(loc);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
