import { connection } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { listMessages, postViewerMessage } from "@/lib/chat";
import { CORS_HEADERS, json, readJsonBody } from "@/lib/http";
import { viewerFromRequest } from "@/lib/view-auth";

export async function GET(request: Request) {
  await connection();
  if (!accessFromRequest(request)) return json({ error: "Viewer login or x-crew-secret required." }, 401);
  return json({ messages: listMessages() });
}

export async function POST(request: Request) {
  await connection();
  if (!viewerFromRequest(request)) return json({ error: "Viewer login required." }, 401);
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const result = postViewerMessage(body.body);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ message: result.message }, 201);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
