export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-crew-secret, Authorization",
};

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "no-store",
    },
  });
}

export async function readJsonBody(
  request: Request,
  limit = 20_000,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > limit) {
    return { ok: false, response: json({ error: "Body too large." }, 413) };
  }
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: json({ error: "Body must be JSON." }, 400) };
  }
}
