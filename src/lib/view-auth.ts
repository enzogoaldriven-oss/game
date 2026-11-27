import { createHmac, timingSafeEqual } from "node:crypto";

export const VIEW_COOKIE = "crew_hq_view";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function viewPassword(): string | null {
  if (process.env.CREW_HQ_VIEW_PASSWORD) return process.env.CREW_HQ_VIEW_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "dev-viewer";
  return null;
}

function signingKey(): string | null {
  if (process.env.CREW_HQ_SECRET) return process.env.CREW_HQ_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-crew-secret";
  return process.env.CREW_HQ_VIEW_PASSWORD ?? null;
}

function passwordTag(password: string): string {
  return createHmac("sha256", "crew-hq-view").update(password).digest("base64url").slice(0, 16);
}

function mac(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function passwordMatches(provided: string): boolean {
  const expected = viewPassword();
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createViewToken(now = Date.now()): string | null {
  const password = viewPassword();
  const key = signingKey();
  if (!password || !key) return null;
  const exp = Math.floor(now / 1000) + MAX_AGE_SECONDS;
  const payload = `${exp}.${passwordTag(password)}`;
  return `${payload}.${mac(payload, key)}`;
}

export function verifyViewToken(token: string | undefined | null): boolean {
  const password = viewPassword();
  const key = signingKey();
  if (!token || !password || !key) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, mac(payload, key))) return false;
  const [expRaw, tag] = payload.split(".");
  if (!expRaw || !tag || !safeEqual(tag, passwordTag(password))) return false;
  const exp = Number(expRaw);
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}

function secureFlag(): string {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function viewCookieHeader(token: string): string {
  return `${VIEW_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secureFlag()}`;
}

export function clearViewCookieHeader(): string {
  return `${VIEW_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag()}`;
}

export function viewerFromRequest(request: Request): boolean {
  const header = request.headers.get("cookie");
  if (!header) return false;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${VIEW_COOKIE}=`)) continue;
    const raw = trimmed.slice(VIEW_COOKIE.length + 1);
    try {
      return verifyViewToken(decodeURIComponent(raw));
    } catch {
      return false;
    }
  }
  return false;
}
