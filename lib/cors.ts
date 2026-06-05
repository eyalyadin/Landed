import { NextRequest, NextResponse } from "next/server";

const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

function allowedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    Vary: "Origin",
  };
}

export function corsPreflight(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function jsonWithCors(
  req: NextRequest,
  body: unknown,
  init?: ResponseInit,
) {
  const res = NextResponse.json(body, init);
  for (const [key, value] of Object.entries(getCorsHeaders(req))) {
    res.headers.set(key, value);
  }
  return res;
}

export function responseWithCors(req: NextRequest, res: Response) {
  for (const [key, value] of Object.entries(getCorsHeaders(req))) {
    res.headers.set(key, value);
  }
  return res;
}
