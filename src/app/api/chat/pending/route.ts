import { connection } from "next/server";
import { listPending } from "@/lib/chat";
import { CORS_HEADERS, json } from "@/lib/http";
import { readProvidedSecret, secretMatches } from "@/lib/store";

export async function GET(request: Request) {
  await connection();
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }
  const bot = new URL(request.url).searchParams.get("bot") ?? "";
  const result = listPending(bot);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ messages: result.messages });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
