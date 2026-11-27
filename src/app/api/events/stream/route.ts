import { connection } from "next/server";
import { CORS_HEADERS, json } from "@/lib/http";
import { subscribe } from "@/lib/store";
import { viewerFromRequest } from "@/lib/view-auth";

export async function GET(request: Request) {
  await connection();
  if (!viewerFromRequest(request)) {
    return json({ error: "Viewer login required." }, 401);
  }
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };
      send(`:${" ".repeat(2048)}\n\n`);
      send(`retry: 3000\n\n`);
      unsubscribe = subscribe((event) => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });
      ping = setInterval(() => send(": ping\n\n"), 20000);
      const close = () => {
        if (ping) clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", close);
    },
    cancel() {
      if (ping) clearInterval(ping);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
