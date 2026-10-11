import { Capacitor } from "@capacitor/core";

const VISITOR_ID_KEY = "sabiright_analytics_visitor_id";
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getAnalyticsVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  if (window.navigator.doNotTrack === "1" || window.location.pathname.startsWith("/admin")) return null;
  try {
    const savedId = window.localStorage.getItem(VISITOR_ID_KEY);
    if (savedId && VISITOR_ID_PATTERN.test(savedId)) return savedId;
    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch (error) {
    console.warn("[Innovation Analytics] Visitor ID is unavailable in this browser:", error);
    return null;
  }
}

export function getAnalyticsChannel(): "web" | "native_app" {
  return Capacitor.isNativePlatform() ? "native_app" : "web";
}

export function recordAnalyticsVisit(): void {
  const visitorId = getAnalyticsVisitorId();
  if (!visitorId) return;

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: getAnalyticsChannel(), visitorId }),
    keepalive: true
  }).then(response => {
    if (!response.ok) {
      console.warn(`[Innovation Analytics] Visit event was rejected (${response.status})`);
    }
  }).catch(error => {
    console.warn("[Innovation Analytics] Visit event could not be sent:", error);
  });
}

export function recordLanguageInteraction(language: string): void {
  const visitorId = getAnalyticsVisitorId();
  if (!visitorId) return;

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: getAnalyticsChannel(),
      eventType: "language_interaction",
      visitorId,
      language
    }),
    keepalive: true
  }).then(response => {
    if (!response.ok) {
      console.warn(`[Innovation Analytics] Language event was rejected (${response.status})`);
    }
  }).catch(error => {
    console.warn("[Innovation Analytics] Language event could not be sent:", error);
  });
}
