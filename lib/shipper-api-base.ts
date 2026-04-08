/**
 * Base URL for ayahay-api-v2 (shipper-auth, my-shipper, etc.).
 * Must be an absolute http(s) URL to the Nest API — not the shipper-dashboard origin.
 */

export function resolveShipperApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_V2_API_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  return "http://localhost:3002";
}

let loggedSameOriginWarning = false;

/** Call from the browser before API requests; no-ops on SSR. */
export function warnIfApiBaseIsDashboardOrigin(apiBaseUrl: string): void {
  if (typeof window === "undefined" || loggedSameOriginWarning) return;
  try {
    const apiOrigin = new URL(apiBaseUrl).origin;
    if (apiOrigin === window.location.origin) {
      loggedSameOriginWarning = true;
      console.error(
        "[shipper-dashboard] NEXT_PUBLIC_V2_API_URL must point at ayahay-api-v2, not this Next.js app. " +
          `Use e.g. http://localhost:3002 while the dashboard runs on port 3003. Current value resolves to: ${apiBaseUrl}`,
      );
    }
  } catch {
    /* ignore */
  }
}
