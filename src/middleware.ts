import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  
  if (!isDashboard && isLoggedIn && req.nextUrl.pathname === "/") {
    // Only redirect if there's no error query param, to prevent loops if onboarding fails
    if (!req.nextUrl.searchParams.has("error")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
