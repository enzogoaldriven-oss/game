import path from "node:path";
import { resolveBot } from "@/lib/bots";
import { resolveClass } from "@/lib/classes";
import { formatPercent, type ClassGrade } from "@/lib/grade-format";
import { readJson, writeJson } from "@/lib/persist";
import { ingestEvent } from "@/lib/store";

const FILE = path.join(process.cwd(), "data", "grades.json");
const SEED = path.join(process.cwd(), "data", "seed-grades.json");
const KEY = "__crewHQClassGrades";

type Bucket = { grades: ClassGrade[] };

export type GradeWriteResult =
  | { ok: true; grade: ClassGrade }
  | { ok: false; status: number; error: string };

function isGrade(value: unknown): value is ClassGrade {
  if (!value || typeof value !== "object") return false;
  const grade = value as Partial<ClassGrade>;
  return (
    typeof grade.bot === "string" &&
    typeof grade.botName === "string" &&
    typeof grade.classId === "string" &&
    typeof grade.className === "string" &&
    typeof grade.percent === "number" &&
    Number.isFinite(grade.percent) &&
    typeof grade.letter === "string" &&
    typeof grade.asOf === "string" &&
    (grade.note === null || typeof grade.note === "string") &&
    (grade.previousPercent === null || typeof grade.previousPercent === "number") &&
    typeof grade.updatedAt === "string"
  );
}

function cleanPercent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 100) return null;
  return Math.round(value * 10) / 10;
}

function cleanLetter(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const letter = value.trim().toUpperCase();
  if (!/^[A-F][+-]?$/.test(letter)) return null;
  return letter;
}

function cleanAsOf(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const trimmed = value.trim();
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return trimmed;
}

function cleanNote(value: unknown): string | null | "bad" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "bad";
  const trimmed = value.trim();
  if (trimmed.length > 160) return "bad";
  return trimmed;
}

function fromSeed(value: unknown): ClassGrade | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { bot?: unknown; class?: unknown; percent?: unknown; letter?: unknown; asOf?: unknown; note?: unknown };
  if (typeof record.bot !== "string") return null;
  const identity = resolveBot(record.bot);
  const subject = resolveClass(record.class) ?? resolveClass(record.bot);
  const percent = cleanPercent(record.percent);
  const letter = cleanLetter(record.letter);
  const asOf = cleanAsOf(record.asOf);
  const note = cleanNote(record.note);
  if (!subject || percent === null || !letter || !asOf || note === "bad") return null;
  return {
    bot: identity.id,
    botName: identity.name,
    classId: subject.id,
    className: subject.name,
    percent,
    letter,
    asOf,
    note,
    previousPercent: null,
    updatedAt: `${asOf}T00:00:00.000Z`,
  };
}

function loadSeed(): ClassGrade[] {
  const parsed = readJson(SEED);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(fromSeed).filter((grade): grade is ClassGrade => grade !== null);
}

function load(): ClassGrade[] {
  const parsed = readJson(FILE);
  if (Array.isArray(parsed)) {
    const saved = parsed.filter(isGrade);
    if (saved.length > 0) return saved;
  }
  const seeded = loadSeed();
  if (seeded.length > 0) persist(seeded);
  return seeded;
}

function bucket(): Bucket {
  const globalBucket = globalThis as typeof globalThis & { [KEY]?: Bucket };
  if (!globalBucket[KEY]) globalBucket[KEY] = { grades: load() };
  return globalBucket[KEY];
}

function persist(grades: ClassGrade[]) {
  writeJson(FILE, grades);
}

export function listClassGrades(): ClassGrade[] {
  return bucket().grades.slice();
}

export function putClassGrade(botInput: string, body: unknown): GradeWriteResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "Body must be a JSON object." };
  }
  const record = body as { class?: unknown; percent?: unknown; letter?: unknown; asOf?: unknown; note?: unknown };
  if (botInput.trim().length === 0 || botInput.trim().length > 64) {
    return { ok: false, status: 400, error: "bot must be a crew name." };
  }
  const identity = resolveBot(botInput);
  const subject = resolveClass(record.class) ?? resolveClass(botInput);
  if (!subject) return { ok: false, status: 400, error: "class must be Psychology, Ethnic Studies, Gov/History, or PE." };
  const percent = cleanPercent(record.percent);
  if (percent === null) return { ok: false, status: 400, error: "percent must be a number from 0 to 100." };
  const letter = cleanLetter(record.letter);
  if (!letter) return { ok: false, status: 400, error: "letter must look like A, B+, C-, D+, or F." };
  const asOf = cleanAsOf(record.asOf);
  if (!asOf) return { ok: false, status: 400, error: "asOf must be a YYYY-MM-DD date." };
  const note = cleanNote(record.note);
  if (note === "bad") return { ok: false, status: 400, error: "note must be 160 characters or fewer." };

  const current = bucket();
  const previous = current.grades.find((grade) => grade.bot === identity.id);
  const changed = !previous || previous.percent !== percent;
  const grade: ClassGrade = {
    bot: identity.id,
    botName: identity.name,
    classId: subject.id,
    className: subject.name,
    percent,
    letter,
    asOf,
    note,
    previousPercent: changed ? (previous ? previous.percent : null) : (previous?.previousPercent ?? null),
    updatedAt: new Date().toISOString(),
  };
  current.grades = [...current.grades.filter((item) => item.bot !== identity.id), grade];
  persist(current.grades);
  if (previous && previous.percent !== percent) {
    ingestEvent({
      bot: identity.name,
      type: "message",
      text: `${subject.name} ${formatPercent(previous.percent)}% → ${formatPercent(percent)}%`,
    });
  }
  return { ok: true, grade };
}
