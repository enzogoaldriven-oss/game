import { randomUUID } from "node:crypto";
import path from "node:path";
import { canonicalBotId, resolveBot } from "@/lib/bots";
import { publish } from "@/lib/live";
import { readJson, writeJson } from "@/lib/persist";
import { EVERYONE_ID, type ChatMessage } from "@/lib/types";

const FILE = path.join(process.cwd(), "data", "chat.json");
const MAX_MESSAGES = 400;
const KEY = "__crewHQChat";

type Bucket = { messages: ChatMessage[] };

export type ChatResult =
  | { ok: true; message: ChatMessage; original?: ChatMessage }
  | { ok: false; status: number; error: string };

export type ChatTarget = { id: string; name: string };

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    typeof message.from === "string" &&
    typeof message.fromName === "string" &&
    typeof message.to === "string" &&
    typeof message.text === "string" &&
    typeof message.timestamp === "string" &&
    typeof message.answered === "boolean" &&
    (message.replyTo === null || typeof message.replyTo === "string")
  );
}

function load(): ChatMessage[] {
  const parsed = readJson(FILE);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isMessage).slice(-MAX_MESSAGES);
}

function bucket(): Bucket {
  const globalBucket = globalThis as typeof globalThis & { [KEY]?: Bucket };
  if (!globalBucket[KEY]) globalBucket[KEY] = { messages: load() };
  return globalBucket[KEY];
}

function persist(messages: ChatMessage[]) {
  writeJson(FILE, messages);
}

function fail(status: number, error: string): ChatResult {
  return { ok: false, status, error };
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return null;
  return trimmed;
}

export function resolveChatTarget(input: string): ChatTarget | null {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return null;
  const id = canonicalBotId(trimmed);
  if (id === EVERYONE_ID) return { id: EVERYONE_ID, name: "Big Brain" };
  const bot = resolveBot(trimmed);
  return { id: bot.id, name: bot.name };
}

function threadId(value: string): string {
  return canonicalBotId(value);
}

export function listMessages(): ChatMessage[] {
  return bucket().messages.map((message) => {
    const to = threadId(message.to);
    const from = message.from === "enzo" ? "enzo" : threadId(message.from);
    if (to === message.to && from === message.from) return message;
    return { ...message, to, from };
  });
}

export function listPending(botQuery: string): { ok: true; messages: ChatMessage[] } | { ok: false; status: number; error: string } {
  const target = resolveChatTarget(botQuery);
  if (!target) return { ok: false, status: 400, error: "bot query is required." };
  const messages = bucket().messages.filter((message) => {
    if (message.answered || message.from !== "enzo") return false;
    const to = threadId(message.to);
    if (target.id === EVERYONE_ID) return to === EVERYONE_ID;
    return to === target.id || to === EVERYONE_ID;
  });
  return { ok: true, messages };
}

export function postViewerMessage(body: unknown): ChatResult {
  if (!body || typeof body !== "object") return fail(400, "Body must be a JSON object.");
  const record = body as { bot?: unknown; text?: unknown };
  if (typeof record.bot !== "string") return fail(400, "bot is required.");
  const target = resolveChatTarget(record.bot);
  if (!target) return fail(400, "bot must be a crew name, or everyone.");
  const text = cleanText(record.text);
  if (!text) return fail(400, "text must be 1 to 500 characters.");

  const message: ChatMessage = {
    id: randomUUID(),
    from: "enzo",
    fromName: "Enzo",
    to: target.id,
    text,
    timestamp: new Date().toISOString(),
    answered: false,
    replyTo: null,
  };
  const current = bucket();
  current.messages.push(message);
  if (current.messages.length > MAX_MESSAGES) current.messages.splice(0, current.messages.length - MAX_MESSAGES);
  persist(current.messages);
  publish({ kind: "chat", message });
  return { ok: true, message };
}

export function postReply(body: unknown): ChatResult {
  if (!body || typeof body !== "object") return fail(400, "Body must be a JSON object.");
  const record = body as { bot?: unknown; text?: unknown; replyTo?: unknown };
  if (typeof record.bot !== "string") return fail(400, "bot is required.");
  const target = resolveChatTarget(record.bot);
  if (!target) return fail(400, "bot must be a crew name.");
  if (target.id === EVERYONE_ID) return fail(400, "A named bot has to send the reply.");
  const text = cleanText(record.text);
  if (!text) return fail(400, "text must be 1 to 500 characters.");
  if (typeof record.replyTo !== "string" || record.replyTo.trim().length === 0) {
    return fail(400, "replyTo must be the viewer message id.");
  }

  const current = bucket();
  const original = current.messages.find((message) => message.id === record.replyTo);
  if (!original) return fail(404, "Message not found.");
  if (original.from !== "enzo") return fail(400, "replyTo must be a viewer message.");
  const to = threadId(original.to);
  const crowd = to === EVERYONE_ID;
  const addressed = to === target.id || crowd;
  if (!addressed) return fail(403, "That message is for a different bot.");
  if (crowd) {
    const alreadyReplied = current.messages.some((message) => message.replyTo === original.id && message.from === target.id);
    if (alreadyReplied) return fail(409, "That bot already replied.");
  } else if (original.answered) {
    return fail(409, "That message was already answered.");
  }

  original.to = to;
  if (!original.answered) original.answered = true;
  const reply: ChatMessage = {
    id: randomUUID(),
    from: target.id,
    fromName: target.name,
    to,
    text,
    timestamp: new Date().toISOString(),
    answered: true,
    replyTo: original.id,
  };
  current.messages.push(reply);
  if (current.messages.length > MAX_MESSAGES) current.messages.splice(0, current.messages.length - MAX_MESSAGES);
  persist(current.messages);
  publish({ kind: "chat", message: original });
  publish({ kind: "chat", message: reply });
  return { ok: true, message: reply, original };
}
