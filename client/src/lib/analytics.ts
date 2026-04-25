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
const AMBASSADOR_CODE_KEY = "vc_ambassador_code";

// House-default attribution for direct/organic traffic with no existing
// ambassador or UTM source. Founder rule (locked 2026-04-25): organic
// conversions default to Colin Slaven; never overwrite an existing
// ambassador / UTM attribution.
const DEFAULT_AMBASSADOR_CODE = "colin_slaven";
const HOUSE_DEFAULT_UTM: Record<string, string> = {
  utm_source: "house",
  utm_medium: "direct",
  utm_campaign: "organic_default",
  utm_content: DEFAULT_AMBASSADOR_CODE,
};

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

  const hasUrlUtm = Object.keys(captured).length > 0;
  const hasFirstTouch = !!localStorage.getItem(FIRST_TOUCH_KEY);
  const hasAmbassadorCode = (() => {
    try {
      return !!(localStorage.getItem(AMBASSADOR_CODE_KEY)
        || sessionStorage.getItem(AMBASSADOR_CODE_KEY));
    } catch { return false; }
  })();

  let toPersist: Record<string, string> | null = null;
  let isHouseDefault = false;

  if (hasUrlUtm) {
    // Real ambassador / campaign URL — persist as session + first-touch.
    toPersist = captured;
    sessionStorage.setItem(SESSION_UTM_KEY, JSON.stringify(captured));
    if (!hasFirstTouch) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(captured));
    }
    // If the URL carries an ambassador code in utm_content and no other
    // ambassador is set, sync it to the ambassador-code store.
    if (captured.utm_content && !hasAmbassadorCode) {
      try { localStorage.setItem(AMBASSADOR_CODE_KEY, captured.utm_content); } catch {}
    }
  } else if (!hasFirstTouch && !hasAmbassadorCode) {
    // True direct/organic visitor — apply house default attribution
    // (Colin Slaven). Never overwrites prior attribution because
    // both first-touch and ambassador-code are checked above.
    toPersist = { ...HOUSE_DEFAULT_UTM };
    isHouseDefault = true;
    sessionStorage.setItem(SESSION_UTM_KEY, JSON.stringify(toPersist));
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(toPersist));
    try { localStorage.setItem(AMBASSADOR_CODE_KEY, DEFAULT_AMBASSADOR_CODE); } catch {}
  } else {
    // Returning visitor with prior attribution — preserve it untouched.
    return;
  }

  try {
    fetch("/api/attribution-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getOrCreateSessionId(),
        utm_source: toPersist.utm_source || null,
        utm_medium: toPersist.utm_medium || null,
        utm_campaign: toPersist.utm_campaign || null,
        utm_content: toPersist.utm_content || null,
        utm_term: toPersist.utm_term || null,
        utm_id: toPersist.utm_id || null,
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
        is_house_default: isHouseDefault || undefined,
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

function getAmbassadorCode(): string | null {
  try {
    return localStorage.getItem(AMBASSADOR_CODE_KEY)
      || sessionStorage.getItem(AMBASSADOR_CODE_KEY)
      || null;
  } catch { return null; }
}

function isMobileUA(): boolean {
  try {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  } catch { return false; }
}

function sendPageViewBeacon(path: string): void {
  try {
    const utm = getUTMParams();
    const payload = {
      sessionId: getOrCreateSessionId(),
      path,
      referrer: document.referrer || null,
      isMobile: isMobileUA(),
      ambassador_code: getAmbassadorCode(),
      ...utm,
    };
    const body = JSON.stringify(payload);
    const url = "/api/beacon/page-view";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackPageView(path: string): void {
  if (path === lastTrackedPath) {
    // Already counted — skip GA + beacon
    return;
  }
  lastTrackedPath = path;
  sendPageViewBeacon(path);
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      ...getUTMParams(),
      ...debugFlag(),
    });
  }
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
