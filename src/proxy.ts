import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/constants";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_super_secret_key_change_in_production",
);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiAuthRoute = pathname.startsWith("/api/auth/");
  const isPublicAsset =
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webp");

  // 0. Allow public assets, PWA manifest, and service worker to pass through
  if (isPublicAsset) {
    return NextResponse.next();
  }

  // 1. If user is already logged in, prevent them from accessing /login or /signup
  if (isAuthRoute) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // Token invalid, allow them to view login page
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. Allow API auth routes to pass through (they handle their own logic)
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 3. Allow the landing page through – page.tsx handles its own auth branch
  if (pathname === "/") {
    if (!token) {
      return NextResponse.next();
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Token invalid — show landing page
      return NextResponse.next();
    }
  }

  // 4. For ALL OTHER routes (both UI and API), enforce authentication
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token is invalid/expired
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - PWA assets: manifest.webmanifest, manifest.json, sw.js, favicon.ico, images/svgs
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
