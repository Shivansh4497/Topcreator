import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname === "/select-account" || pathname === "/process-auth";

  // Protect dashboard — redirect to login if not logged in
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Protect mid-onboarding pages — redirect to login if not logged in
  if (isOnboarding && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // If logged-in user tries to hit "/" (landing/login) without an error,
  // send them to the dashboard
  if (pathname === "/" && isLoggedIn) {
    if (!req.nextUrl.searchParams.has("error")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
