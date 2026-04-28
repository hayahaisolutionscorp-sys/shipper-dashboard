/**
 * Base URL for the shipper API v2 (shipper-auth, my-shipper, etc.).
 * Must be an absolute http(s) URL to the Nest API — not the shipper-dashboard origin.
 */

const SHIPPER_PROXY_BASE_URL = "/api";

export function resolveShipperApiBaseUrl(): string {
  // Browser requests should always use same-origin rewrite proxy so auth cookies
  // are scoped to the shipper dashboard domain.
  if (typeof window !== "undefined") {
    return SHIPPER_PROXY_BASE_URL;
  }

  const rawCandidates = [
    process.env.AYAHAY_API_URL,
    process.env.NEXT_PUBLIC_V2_API_URL,
  ];

  for (const candidate of rawCandidates) {
    const trimmed = typeof candidate === "string" ? candidate.trim() : "";
    if (trimmed && /^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, "");
    }
  }

  return "http://localhost:3002";
}

let loggedSameOriginWarning = false;

/** Call from the browser before API requests; no-ops on SSR. */
export function warnIfApiBaseIsDashboardOrigin(apiBaseUrl: string): void {
  if (typeof window === "undefined" || loggedSameOriginWarning) return;

  // Relative same-origin proxy (`/api`) is expected and recommended.
  if (apiBaseUrl.startsWith("/")) {
    return;
  }

  try {
    const apiOrigin = new URL(apiBaseUrl).origin;
    if (apiOrigin === window.location.origin) {
      loggedSameOriginWarning = true;
      console.error(
        "[shipper-dashboard] NEXT_PUBLIC_V2_API_URL must point at the shipper API, not this Next.js app. " +
          `Use e.g. http://localhost:3002 while the dashboard runs on port 3003. Current value resolves to: ${apiBaseUrl}`,
      );
    }
  } catch {
    /* ignore */
  }
}
