// Minimal single-landlord session: an HMAC-signed token in an httpOnly cookie.
// Uses Web Crypto so it runs in both the Edge middleware and Node route handlers.

export const SESSION_COOKIE = "landed_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Copy into a fresh ArrayBuffer-backed view so the value is a plain BufferSource
// (avoids the Uint8Array<ArrayBufferLike> vs BufferSource mismatch in Web Crypto types).
function toBufferSource(u: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u.byteLength);
  new Uint8Array(out).set(u);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    toBufferSource(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(): Promise<string> {
  const payload = encoder.encode(JSON.stringify({ role: "landlord", iat: Date.now() }));
  const key = await getKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, toBufferSource(payload)));
  return `${toBase64Url(payload)}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [p, s] = token.split(".");
  if (!p || !s) return false;
  try {
    const key = await getKey();
    const payload = fromBase64Url(p);
    const sig = fromBase64Url(s);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      toBufferSource(sig),
      toBufferSource(payload),
    );
    if (!valid) return false;
    const data = JSON.parse(new TextDecoder().decode(payload)) as {
      role?: string;
      iat?: number;
    };
    if (data.role !== "landlord" || typeof data.iat !== "number") return false;
    return Date.now() - data.iat <= MAX_AGE_MS;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;
