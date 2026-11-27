import { randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { resolveBot } from "@/lib/bots";
import { publish } from "@/lib/live";
import { readJson, writeJson } from "@/lib/persist";
import { EVENT_TYPES, isCrewEvent, isEventType, type CrewEvent, type EventType } from "@/lib/types";

const FILE = path.join(process.cwd(), "data", "events.json");
const MAX_EVENTS = 200;
const GLOBAL_KEY = "__crewHQStore";

type Store = {
  events: CrewEvent[];
};

function load(): CrewEvent[] {
  const parsed = readJson(FILE);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isCrewEvent).slice(-MAX_EVENTS);
}

function persist(events: CrewEvent[]) {
  writeJson(FILE, events);
}

function getStore(): Store {
  const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Store };
  if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = { events: load() };
  }
  return globalStore[GLOBAL_KEY];
}

export function listEvents(): CrewEvent[] {
  return getStore().events.slice();
}

function expectedSecret(): string | null {
  if (process.env.CREW_HQ_SECRET) return process.env.CREW_HQ_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-crew-secret";
  return null;
}

export function readProvidedSecret(request: Request): string | null {
  const header = request.headers.get("x-crew-secret");
  if (header) return header.trim();
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export function secretMatches(provided: string | null): boolean {
  const expected = expectedSecret();
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type IngestResult =
  | { ok: true; event: CrewEvent }
  | { ok: false; status: number; error: string };

export function ingestEvent(body: unknown): IngestResult {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Body must be a JSON object." };
  }
  const record = body as { bot?: unknown; type?: unknown; text?: unknown };
  if (typeof record.bot !== "string" || record.bot.trim().length === 0 || record.bot.trim().length > 48) {
    return { ok: false, status: 400, error: "bot must be a name up to 48 characters." };
  }
  if (!isEventType(record.type)) {
    return {
      ok: false,
      status: 400,
      error: `type must be one of ${EVENT_TYPES.join(", ")}.`,
    };
  }
  if (typeof record.text !== "string" || record.text.trim().length === 0 || record.text.trim().length > 280) {
    return { ok: false, status: 400, error: "text must be 1 to 280 characters." };
  }

  const identity = resolveBot(record.bot);
  const event: CrewEvent = {
    id: randomUUID(),
    bot: identity.id,
    botName: identity.name,
    department: identity.department,
    known: identity.known,
    type: record.type as EventType,
    text: record.text.trim(),
    createdAt: new Date().toISOString(),
  };

  const store = getStore();
  store.events.push(event);
  if (store.events.length > MAX_EVENTS) {
    store.events.splice(0, store.events.length - MAX_EVENTS);
  }
  persist(store.events);
  publish({ kind: "event", event });
  return { ok: true, event };
}
