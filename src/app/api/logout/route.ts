import { clearViewCookieHeader } from "@/lib/view-auth";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const headers = new Headers({
    "Set-Cookie": clearViewCookieHeader(),
    "Cache-Control": "no-store",
  });
  if (!contentType.includes("application/json")) {
    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  }
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
