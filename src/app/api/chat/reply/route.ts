import { connection } from "next/server";
import { postReply } from "@/lib/chat";
import { CORS_HEADERS, json, readJsonBody } from "@/lib/http";
import { readProvidedSecret, secretMatches } from "@/lib/store";

export async function POST(request: Request) {
  await connection();
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const result = postReply(body.body);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ message: result.message, original: result.original }, 201);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
