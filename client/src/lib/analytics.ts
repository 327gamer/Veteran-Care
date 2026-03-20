declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const MEASUREMENT_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID as string) || "";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function captureUTM(): void {
  const params = new URLSearchParams(window.location.search);
  const captured: Record<string, string> = {};
  UTM_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val) captured[key] = val;
  });
  if (Object.keys(captured).length > 0) {
    sessionStorage.setItem("vc_utm", JSON.stringify(captured));
  }
}

export function getUTMParams(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem("vc_utm") || "{}");
  } catch {
    return {};
  }
}

export function initAnalytics(): void {
  captureUTM();
  if (!MEASUREMENT_ID) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string): void {
  if (!MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    ...getUTMParams(),
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, {
    ...params,
    ...getUTMParams(),
  });
}
