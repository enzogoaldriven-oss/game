import { connection } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { createTodo, listTodos } from "@/lib/grades";
import { json, readJsonBody, CORS_HEADERS } from "@/lib/http";
import { readProvidedSecret, secretMatches } from "@/lib/store";

export async function GET(request: Request) {
  await connection();
  if (!accessFromRequest(request)) return json({ error: "Viewer login or x-crew-secret required." }, 401);
  return json({ todos: listTodos() });
}

export async function POST(request: Request) {
  await connection();
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const result = createTodo(body.body);
  if (!result.ok) return json({ error: result.error }, result.status);
  if (!("todo" in result)) return json({ error: "Could not create the item." }, 500);
  return json({ todo: result.todo }, 201);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
