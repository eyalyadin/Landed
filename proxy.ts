import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

// Endpoints that authenticate themselves (Telegram secret / cron secret) or must
// stay public, so they bypass the landlord cookie check.
const PUBLIC_API_PREFIXES = [
  "/api/telegram/webhook",
  "/api/health",
  "/api/cron",
  "/api/auth",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return corsPreflight(req);
  }

  if (pathname === "/login") return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
