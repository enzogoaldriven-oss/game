import { createViewToken, passwordMatches, viewCookieHeader, viewPassword } from "@/lib/view-auth";
import { json } from "@/lib/http";

async function readPassword(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { password?: unknown };
      return typeof body.password === "string" ? body.password : "";
    } catch {
      return "";
    }
  }
  try {
    const form = await request.formData();
    const value = form.get("password");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function wantsPage(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return !contentType.includes("application/json");
}

export async function POST(request: Request) {
  const password = await readPassword(request);
  const page = wantsPage(request);

  if (!viewPassword()) {
    if (page) return redirectTo("/?unconfigured=1");
    return json({ error: "CREW_HQ_VIEW_PASSWORD is not set." }, 503);
  }

  if (!passwordMatches(password)) {
    if (page) return redirectTo("/?denied=1");
    return json({ error: "Wrong viewer password." }, 401);
  }

  const token = createViewToken();
  if (!token) return json({ error: "Could not start a viewer session." }, 500);

  if (page) return redirectTo("/", viewCookieHeader(token));
  const headers = new Headers({
    "Set-Cookie": viewCookieHeader(token),
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

function redirectTo(path: string, cookie?: string) {
  const headers = new Headers({
    Location: path,
    "Cache-Control": "no-store",
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
