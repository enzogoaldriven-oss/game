import { randomUUID } from "node:crypto";
import path from "node:path";
import { resolveBot } from "@/lib/bots";
import { resolveClass } from "@/lib/classes";
import { publish } from "@/lib/live";
import { readJson, writeJson } from "@/lib/persist";
import {
  TODO_PRIORITIES,
  TODO_STATUSES,
  type GradeTodo,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/types";

const FILE = path.join(process.cwd(), "data", "todos.json");
const SEED = path.join(process.cwd(), "data", "seed-todos.json");
const MAX_TODOS = 300;
const KEY = "__crewHQTodos";

type Bucket = { todos: GradeTodo[] };

export type GradeResult =
  | { ok: true; todo: GradeTodo }
  | { ok: true; deleted: true }
  | { ok: false; status: number; error: string };

function isPriority(value: unknown): value is TodoPriority {
  return typeof value === "string" && (TODO_PRIORITIES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is TodoStatus {
  return typeof value === "string" && (TODO_STATUSES as readonly string[]).includes(value);
}

function isTodo(value: unknown): value is GradeTodo {
  if (!value || typeof value !== "object") return false;
  const todo = value as Partial<GradeTodo>;
  return (
    typeof todo.id === "string" &&
    typeof todo.bot === "string" &&
    typeof todo.botName === "string" &&
    typeof todo.classId === "string" &&
    typeof todo.className === "string" &&
    typeof todo.title === "string" &&
    (todo.due === null || typeof todo.due === "string") &&
    isStatus(todo.status) &&
    isPriority(todo.priority) &&
    (todo.link === null || typeof todo.link === "string") &&
    typeof todo.createdAt === "string" &&
    typeof todo.updatedAt === "string"
  );
}

function loadSeed(): GradeTodo[] {
  const parsed = readJson(SEED);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isTodo);
}

function load(): GradeTodo[] {
  const parsed = readJson(FILE);
  if (Array.isArray(parsed)) {
    const saved = parsed.filter(isTodo);
    if (saved.length > 0) return saved.slice(-MAX_TODOS);
  }
  const seeded = loadSeed();
  if (seeded.length > 0) persist(seeded);
  return seeded;
}

function bucket(): Bucket {
  const globalBucket = globalThis as typeof globalThis & { [KEY]?: Bucket };
  if (!globalBucket[KEY]) globalBucket[KEY] = { todos: load() };
  return globalBucket[KEY];
}

function persist(todos: GradeTodo[]) {
  writeJson(FILE, todos);
}

function fail(status: number, error: string): GradeResult {
  return { ok: false, status, error };
}

function cleanDue(value: unknown): string | null | "bad" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "bad";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "bad";
    return trimmed;
  }
  return "bad";
}

function cleanPriority(value: unknown): TodoPriority | "bad" {
  if (value == null || value === "") return "normal";
  if (typeof value !== "string") return "bad";
  const norm = value.trim().toLowerCase();
  if (norm === "medium") return "normal";
  if (norm === "low" || norm === "normal" || norm === "high") return norm;
  return "bad";
}

function cleanLink(value: unknown): string | null | "bad" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "bad";
  const trimmed = value.trim();
  if (trimmed.length > 400) return "bad";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "bad";
    return url.toString();
  } catch {
    return "bad";
  }
}

function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 140) return null;
  return trimmed;
}

export function listTodos(): GradeTodo[] {
  return bucket().todos.slice();
}

export function createTodo(body: unknown): GradeResult {
  if (!body || typeof body !== "object") return fail(400, "Body must be a JSON object.");
  const record = body as Record<string, unknown>;
  if (typeof record.bot !== "string" || record.bot.trim().length === 0 || record.bot.trim().length > 48) {
    return fail(400, "bot must be a name up to 48 characters.");
  }
  const subject = resolveClass(record.class) ?? resolveClass(record.bot);
  if (!subject) return fail(400, "class must be Psychology, Ethnic Studies, Gov/History, or PE.");
  const title = cleanTitle(record.title);
  if (!title) return fail(400, "title must be 1 to 140 characters.");
  const due = cleanDue(record.due);
  if (due === "bad") return fail(400, "due must be a YYYY-MM-DD date.");
  const priority = cleanPriority(record.priority);
  if (priority === "bad") return fail(400, "priority must be low, normal, or high.");
  const link = cleanLink(record.link);
  if (link === "bad") return fail(400, "link must be an http or https URL.");

  const identity = resolveBot(record.bot);
  const now = new Date().toISOString();
  const todo: GradeTodo = {
    id: randomUUID(),
    bot: identity.id,
    botName: identity.name,
    classId: subject.id,
    className: subject.name,
    title,
    due,
    status: "todo",
    priority,
    link,
    createdAt: now,
    updatedAt: now,
  };
  const current = bucket();
  current.todos.push(todo);
  if (current.todos.length > MAX_TODOS) current.todos.splice(0, current.todos.length - MAX_TODOS);
  persist(current.todos);
  publish({ kind: "todo", action: "upsert", todo });
  return { ok: true, todo };
}

export function updateTodo(id: string, body: unknown, viewerOnly: boolean): GradeResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail(400, "Body must be a JSON object.");
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return fail(400, "Send at least one field to update.");
  if (viewerOnly && keys.some((key) => key !== "status")) {
    return fail(400, "Viewers can only change status.");
  }
  const allowed = new Set(["status", "title", "due", "priority", "link", "class"]);
  if (keys.some((key) => !allowed.has(key))) return fail(400, "Unknown field.");

  const current = bucket();
  const todo = current.todos.find((item) => item.id === id);
  if (!todo) return fail(404, "Todo not found.");
  const next: GradeTodo = { ...todo };

  if ("status" in record) {
    if (!isStatus(record.status)) return fail(400, "status must be todo or done.");
    next.status = record.status;
  }
  if ("title" in record) {
    const title = cleanTitle(record.title);
    if (!title) return fail(400, "title must be 1 to 140 characters.");
    next.title = title;
  }
  if ("due" in record) {
    const due = cleanDue(record.due);
    if (due === "bad") return fail(400, "due must be a YYYY-MM-DD date.");
    next.due = due;
  }
  if ("priority" in record) {
    const priority = cleanPriority(record.priority);
    if (priority === "bad") return fail(400, "priority must be low, normal, or high.");
    next.priority = priority;
  }
  if ("link" in record) {
    const link = cleanLink(record.link);
    if (link === "bad") return fail(400, "link must be an http or https URL.");
    next.link = link;
  }
  if ("class" in record) {
    const subject = resolveClass(record.class);
    if (!subject) return fail(400, "class must be Psychology, Ethnic Studies, Gov/History, or PE.");
    next.classId = subject.id;
    next.className = subject.name;
  }

  next.updatedAt = new Date().toISOString();
  const index = current.todos.findIndex((item) => item.id === id);
  current.todos[index] = next;
  persist(current.todos);
  publish({ kind: "todo", action: "upsert", todo: next });
  return { ok: true, todo: next };
}

export function deleteTodo(id: string): GradeResult {
  const current = bucket();
  const index = current.todos.findIndex((item) => item.id === id);
  if (index < 0) return fail(404, "Todo not found.");
  current.todos.splice(index, 1);
  persist(current.todos);
  publish({ kind: "todo", action: "delete", id });
  return { ok: true, deleted: true };
}
