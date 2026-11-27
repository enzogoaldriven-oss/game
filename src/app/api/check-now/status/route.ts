import { connection } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { checkSnapshot } from "@/lib/check-now";
import { CORS_HEADERS, json } from "@/lib/http";

export async function GET(request: Request) {
  await connection();
  if (!accessFromRequest(request)) return json({ error: "Viewer login or x-crew-secret required." }, 401);
  return json(checkSnapshot());
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
