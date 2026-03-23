declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const MEASUREMENT_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID as string) || "";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"] as const;

const FIRST_TOUCH_KEY = "vc_utm_first";
const SESSION_UTM_KEY = "vc_utm";
const DEDUP_KEY = "vc_event_dedup";
const DEDUP_TTL = 30 * 60 * 1000;

export function captureUTM(): void {
  const params = new URLSearchParams(window.location.search);
  const captured: Record<string, string> = {};
  UTM_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val) captured[key] = val;
  });
  if (Object.keys(captured).length === 0) return;

  sessionStorage.setItem(SESSION_UTM_KEY, JSON.stringify(captured));

  if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(captured));
  }
}

export function getUTMParams(): Record<string, string> {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_UTM_KEY) || "{}");
    const first = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY) || "{}");
    const merged: Record<string, string> = {};
    UTM_KEYS.forEach((key) => {
      if (session[key]) merged[key] = session[key];
      else if (first[key]) merged[key] = first[key];
    });
    return merged;
  } catch {
    return {};
  }
}

const isDebug = () => {
  try {
    return new URLSearchParams(window.location.search).has("ga_debug")
      || localStorage.getItem("vc_ga_debug") === "1";
  } catch { return false; }
};

export function initAnalytics(): void {
  captureUTM();
  if (!MEASUREMENT_ID) return;

  const debug = isDebug();
  if (debug) localStorage.setItem("vc_ga_debug", "1");

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    send_page_view: false,
    ...(debug ? { debug_mode: true } : {}),
  });
}

let lastTrackedPath = "";

function debugParams(): Record<string, boolean> {
  return isDebug() ? { debug_mode: true } : {};
}

export function trackPageView(path: string): void {
  if (!MEASUREMENT_ID || typeof window.gtag !== "function") return;
  if (path === lastTrackedPath) return;
  lastTrackedPath = path;
  window.gtag("event", "page_view", {
    page_path: path,
    ...getUTMParams(),
    ...debugParams(),
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, {
    page_path: window.location.pathname,
    ...params,
    ...getUTMParams(),
    ...debugParams(),
  });
}

function getDedupStore(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(DEDUP_KEY) || "{}");
  } catch {
    return {};
  }
}

export function trackEventDedup(
  name: string,
  dedupId: string,
  params?: Record<string, string | number | boolean>
): void {
  const store = getDedupStore();
  const now = Date.now();

  Object.keys(store).forEach((k) => {
    if (now - store[k] > DEDUP_TTL) delete store[k];
  });

  const key = `${name}:${dedupId}`;
  if (store[key]) return;

  store[key] = now;
  sessionStorage.setItem(DEDUP_KEY, JSON.stringify(store));
  trackEvent(name, params);
}
