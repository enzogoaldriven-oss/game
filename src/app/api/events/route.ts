import { connection } from "next/server";
import { json, CORS_HEADERS } from "@/lib/http";
import { ingestEvent, listEvents, readProvidedSecret, secretMatches } from "@/lib/store";
import { viewerFromRequest } from "@/lib/view-auth";

export async function GET(request: Request) {
  await connection();
  if (!viewerFromRequest(request)) {
    return json({ error: "Viewer login required." }, 401);
  }
  return json({ events: listEvents() });
}

export async function POST(request: Request) {
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 10_000) {
    return json({ error: "Body too large." }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const result = ingestEvent(body);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ event: result.event }, 201);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
