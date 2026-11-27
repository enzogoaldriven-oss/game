import { connection } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { requestCheck } from "@/lib/check-now";
import { CORS_HEADERS, json } from "@/lib/http";

export async function POST(request: Request) {
  await connection();
  if (!accessFromRequest(request)) return json({ error: "Viewer login or x-crew-secret required." }, 401);
  const result = await requestCheck();
  if (!result.ok) {
    return json(
      result.secondsLeft !== undefined ? { error: result.error, secondsLeft: result.secondsLeft } : { error: result.error },
      result.status,
    );
  }
  return json({ ok: true, ...result.snapshot });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
