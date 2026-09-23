import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  // 1. If user is already logged in, prevent them from accessing /login or /signup
  if (isAuthRoute) {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const completed = payload.onboarding === "completed";
        return NextResponse.redirect(
          new URL(completed ? "/" : "/onboarding", request.url),
        );
      }
    }
    return NextResponse.next();
  }

  // 2. Allow the landing page through – page.tsx handles its own auth branch,
  //    but still push authenticated users who haven't onboarded to /onboarding.
  if (pathname === "/") {
    if (!token) {
      return NextResponse.next();
    }
    const payload = await verifyToken(token);
    if (payload && payload.onboarding !== "completed") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  // 3. For all other UI routes, enforce authentication
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (payload) {
    const onOnboarding =
      pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (payload.onboarding !== "completed" && !onOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match UI request paths except for:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - PWA assets: manifest.webmanifest, sw.js, favicon.ico, images
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
