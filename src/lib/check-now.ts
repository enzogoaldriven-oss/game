import { createHmac } from "node:crypto";
import path from "node:path";
import { crewSecret, ingestEvent } from "@/lib/store";
import { readJson, writeJson } from "@/lib/persist";

const FILE = path.join(process.cwd(), "data", "check-now.json");
const KEY = "__crewHQCheckNow";
const COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_WAKE_URL = "https://api2.cursor.sh/automations/webhook/ff258077-f560-5289-b1d9-7efdbe8aa962";

export type CheckSnapshot = {
  lastCheckAt: string | null;
  nextAllowedAt: string | null;
  secondsLeft: number;
  lastResult: string | null;
};

type SavedCheck = {
  lastCheckAt: string | null;
  nextAllowedAt: string | null;
  lastResult: string | null;
};

function emptyCheck(): SavedCheck {
  return { lastCheckAt: null, nextAllowedAt: null, lastResult: null };
}

function isSaved(value: unknown): value is SavedCheck {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<SavedCheck>;
  return (
    (record.lastCheckAt === null || typeof record.lastCheckAt === "string") &&
    (record.nextAllowedAt === null || typeof record.nextAllowedAt === "string") &&
    (record.lastResult === null || typeof record.lastResult === "string")
  );
}

function load(): SavedCheck {
  const parsed = readJson(FILE);
  if (!isSaved(parsed)) return emptyCheck();
  return parsed;
}

function bucket(): { state: SavedCheck } {
  const globalBucket = globalThis as typeof globalThis & { [KEY]?: { state: SavedCheck } };
  if (!globalBucket[KEY]) globalBucket[KEY] = { state: load() };
  return globalBucket[KEY];
}

function persist(state: SavedCheck) {
  writeJson(FILE, state);
}

export function wakeUrl(): string {
  const configured = process.env.CREW_HQ_WAKE_URL?.trim();
  return configured || DEFAULT_WAKE_URL;
}

export function checkSnapshot(now = Date.now()): CheckSnapshot {
  const state = bucket().state;
  const next = state.nextAllowedAt ? Date.parse(state.nextAllowedAt) : Number.NaN;
  const secondsLeft = Number.isFinite(next) && next > now ? Math.ceil((next - now) / 1000) : 0;
  return {
    lastCheckAt: state.lastCheckAt,
    nextAllowedAt: state.nextAllowedAt,
    secondsLeft,
    lastResult: state.lastResult,
  };
}

function activityText(result: string) {
  if (/^\d{3}$/.test(result)) return `Check requested · ${result}`;
  return "Check requested · no response";
}

export async function requestCheck(now = new Date()): Promise<
  { ok: true; snapshot: CheckSnapshot } | { ok: false; status: number; error: string; secondsLeft?: number }
> {
  const current = checkSnapshot(now.getTime());
  if (current.secondsLeft > 0) {
    return { ok: false, status: 429, error: "Check is cooling down.", secondsLeft: current.secondsLeft };
  }
  const secret = crewSecret();
  if (!secret) return { ok: false, status: 503, error: "CREW_HQ_SECRET is not set." };

  let url: URL;
  try {
    url = new URL(wakeUrl());
  } catch {
    return { ok: false, status: 500, error: "Wake URL is not valid." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, status: 500, error: "Wake URL is not valid." };
  }

  const requestedAt = now.toISOString();
  const rawBody = JSON.stringify({ source: "crew-hq", reason: "check-now", requestedAt });
  const timestamp = Math.floor(now.getTime() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const nextAllowedAt = new Date(now.getTime() + COOLDOWN_MS).toISOString();
  const reserved: SavedCheck = { lastCheckAt: requestedAt, nextAllowedAt, lastResult: "pending" };
  bucket().state = reserved;
  persist(reserved);

  let lastResult = "error";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Crew-Signature": `t=${timestamp},v1=${signature}`,
      },
      body: rawBody,
    });
    lastResult = String(response.status);
  } catch {
    console.error("Crew HQ wake webhook failed");
  }

  const saved: SavedCheck = { lastCheckAt: requestedAt, nextAllowedAt, lastResult };
  bucket().state = saved;
  persist(saved);
  ingestEvent({ bot: "HQ", type: "message", text: activityText(lastResult) });
  return { ok: true, snapshot: checkSnapshot(Date.now()) };
}
