import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/pricing",
  "/features",
  "/download",
  "/about",
  "/blog",
  "/careers",
  "/privacy",
  "/terms",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/invite",
  "/account-deactivated",
  "/workspace-suspended",
  "/admin/login",
  "/api/auth",
  "/api/admin/login",
  // Invited users hit these before they have a session (preview + accept),
  // so this whole prefix must stay public. Session-dependent behavior (e.g.
  // joining an org as an already-logged-in user) is enforced inside the
  // route handlers themselves, not by this middleware.
  "/api/invites",
];

function isPublicPath (pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
  );
}

function isSuperAdminPath (pathname: string): boolean {
  return (
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
  );
}

// --- Lightweight rate limiting for credential/auth Next.js route handlers ---
// This mirrors the API's `authLimiter` (10 req / 15 min) so that the web app's
// own /api/auth/* and /api/admin/login routes aren't left unprotected against
// brute-force / credential-stuffing attempts. In-memory per-instance, same
// trade-off as the express-rate-limit default store used by the API.
const RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-reset-otp",
  "/api/admin/login",
  "/api/invites",
];
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedPath (pathname: string): boolean {
  return RATE_LIMITED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function checkRateLimit (key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function proxy (request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && isRateLimitedPath(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const allowed = checkRateLimit(`${ip}:${pathname}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests, please try again later" },
        { status: 429 }
      );
    }
  }

  if (isSuperAdminPath(pathname) && !pathname.startsWith("/admin/login") && !pathname.startsWith("/api/admin/login")) {
    const hasSuperAdmin = request.cookies.get("chronos_superadmin")?.value;
    if (!hasSuperAdmin) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isPublicPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const hasSession =
    request.cookies.get("chronos_access")?.value ||
    request.cookies.get("chronos_refresh")?.value;

  if (!hasSession) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signIn);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
