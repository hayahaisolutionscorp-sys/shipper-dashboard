import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route protection middleware.
 * Checks for the HttpOnly access_token cookie set by the backend.
 * This prevents the flash of protected content before client-side JS redirects.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicPaths = ["/login", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("refresh_token");
  const hasAnyToken = hasAccessToken || hasRefreshToken;

  // If accessing a protected route without any token, redirect to login
  if (!isPublicPath && !hasAnyToken) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, api routes, and Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico|hayahai-v2.png|cebu-port.jpg|api).*)",
  ],
};
