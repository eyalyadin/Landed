import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as { password?: string } | null;
  const expected = process.env.LANDLORD_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "LANDLORD_PASSWORD is not configured" },
      { status: 500 },
    );
  }
  if (!payload?.password || payload.password !== expected) {
    return NextResponse.json({ error: "סיסמה שגויה / wrong password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
