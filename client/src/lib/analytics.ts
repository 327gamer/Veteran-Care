declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const MEASUREMENT_ID = "G-CPZXC6Y900";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"] as const;

const FIRST_TOUCH_KEY = "vc_utm_first";
const SESSION_UTM_KEY = "vc_utm";
const DEDUP_KEY = "vc_event_dedup";
const DEDUP_TTL = 30 * 60 * 1000;

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem("vc_session_id");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("vc_session_id", sid);
  }
  return sid;
}

export function captureUTM(): void {
  getOrCreateSessionId();

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

  try {
    fetch("/api/attribution-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getOrCreateSessionId(),
        utm_source: captured.utm_source || null,
        utm_medium: captured.utm_medium || null,
        utm_campaign: captured.utm_campaign || null,
        utm_content: captured.utm_content || null,
        utm_term: captured.utm_term || null,
        utm_id: captured.utm_id || null,
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  } catch {}
}

export function getUTMParams(): Record<string, string> {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_UTM_KEY) || "{}");
    const first = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY) || "{}");
    const merged: Record<string, string> = {};
    UTM_KEYS.forEach((key) => {
      if (key === "utm_id") {
        merged[key] = first[key] || session[key];
      } else {
        if (session[key]) merged[key] = session[key];
        else if (first[key]) merged[key] = first[key];
      }
    });
    Object.keys(merged).forEach((k) => { if (!merged[k]) delete merged[k]; });
    return merged;
  } catch {
    return {};
  }
}

const isDebug = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).has("ga_debug")
      || localStorage.getItem("vc_ga_debug") === "1";
  } catch { return false; }
};

export function initAnalytics(): void {
  captureUTM();

  const debug = isDebug();
  if (debug) localStorage.setItem("vc_ga_debug", "1");

  if (typeof window.gtag !== "function") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: any[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());

    if (!document.querySelector(`script[src*="gtag/js?id=${MEASUREMENT_ID}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
  }

  if (debug) {
    window.gtag("set", { debug_mode: true });
    window.gtag("config", MEASUREMENT_ID, { send_page_view: false, debug_mode: true });
  }
}

let lastTrackedPath = "";

function debugFlag(): Record<string, boolean> {
  return isDebug() ? { debug_mode: true } : {};
}

export function trackPageView(path: string): void {
  if (typeof window.gtag !== "function") return;
  if (path === lastTrackedPath) return;
  lastTrackedPath = path;
  window.gtag("event", "page_view", {
    page_path: path,
    ...getUTMParams(),
    ...debugFlag(),
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
    ...debugFlag(),
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
