import { connection } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { deleteTodo, updateTodo } from "@/lib/grades";
import { CORS_HEADERS, json, readJsonBody } from "@/lib/http";
import { readProvidedSecret, secretMatches } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const access = accessFromRequest(request);
  if (!access) return json({ error: "Viewer login or x-crew-secret required." }, 401);
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const result = updateTodo(id, body.body, access === "viewer");
  if (!result.ok) return json({ error: result.error }, result.status);
  if (!("todo" in result)) return json({ error: "Could not update the item." }, 500);
  return json({ todo: result.todo });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  if (!secretMatches(readProvidedSecret(request))) {
    return json({ error: "Invalid or missing x-crew-secret header." }, 401);
  }
  const { id } = await params;
  const result = deleteTodo(id);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
