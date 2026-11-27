import { connection } from "next/server";
import { putClassGrade } from "@/lib/class-grades";
import { CORS_HEADERS, json, readJsonBody } from "@/lib/http";
import { readProvidedSecret, secretMatches } from "@/lib/store";

export async function PUT(request: Request, { params }: { params: Promise<{ bot: string }> }) {
  await connection();
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }
  const { bot } = await params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const result = putClassGrade(decodeURIComponent(bot), body.body);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ grade: result.grade });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
