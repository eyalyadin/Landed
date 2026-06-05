import { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as { password?: string } | null;
  const expected = process.env.LANDLORD_PASSWORD;
  const allowPasswordless =
    process.env.ALLOW_PASSWORDLESS_LOGIN === "true" && process.env.NODE_ENV !== "production";

  if (!expected && !allowPasswordless) {
    return jsonWithCors(
      req,
      { error: "LANDLORD_PASSWORD is not configured" },
      { status: 500 },
    );
  }
  if (!allowPasswordless && (!payload?.password || payload.password !== expected)) {
    return jsonWithCors(req, { error: "סיסמה שגויה / wrong password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = jsonWithCors(req, { ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
