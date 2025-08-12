import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isLoggedIn = req.cookies.get("auth")?.value === "1";
  const url = req.nextUrl.clone();

  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};




