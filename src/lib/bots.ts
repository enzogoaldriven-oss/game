import type { EventType } from "@/lib/types";

export type Variant = "boone" | "bhon" | "prendagas" | "bates" | "generic";

export type BotProfile = {
  id: string;
  name: string;
  short: string;
  department: string;
  room: string;
  variant: Variant;
  aliases: string[];
  blurb: string;
};

export const KNOWN_BOTS: BotProfile[] = [
  {
    id: "ms-boone",
    name: "Ms Boone",
    short: "Ms Boone",
    department: "Psychology",
    room: "Psychology",
    variant: "boone",
    aliases: ["ms boone", "msboone", "mrs boone", "miss boone", "boone"],
    blurb: "Psychology. Purple cardigan, glasses, a brain model, and a clipboard.",
  },
  {
    id: "ms-bhon",
    name: "Ms Bhon",
    short: "Ms Bhon",
    department: "Ethnic Studies",
    room: "Ethnic Studies",
    variant: "bhon",
    aliases: ["ms bhon", "msbhon", "ms bhone", "bhon", "ms bohn", "msbohn", "bohn"],
    blurb: "Ethnic Studies. Orange minion, denim jacket, mountain pack, timeline scroll.",
  },
  {
    id: "mr-prendagas",
    name: "Mr Prendagas",
    short: "Mr Prendagas",
    department: "History & Government",
    room: "History & Gov",
    variant: "prendagas",
    aliases: [
      "mr prendagas",
      "mrprendagas",
      "prendagas",
      "mr prendagas gov",
    ],
    blurb: "History & Government. Navy suit, red tie, gavel, and a Constitution scroll.",
  },
  {
    id: "coach-bates",
    name: "Coach Bates",
    short: "Coach Bates",
    department: "P.E.",
    room: "P.E.",
    variant: "bates",
    aliases: ["coach bates", "coachbates", "bates"],
    blurb: "P.E. Green tracksuit, whistle, stopwatch, and a dumbbell.",
  },
];

const BY_ID = new Map(KNOWN_BOTS.map((bot) => [bot.id, bot]));

export function normalizeBotInput(input: string): string {
  let value = input.trim().toLowerCase().replace(/\./g, "");
  value = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  while (value.startsWith("visitor ")) value = value.slice("visitor ".length).trim();
  return value;
}

const BY_ALIAS = new Map<string, BotProfile>();
for (const bot of KNOWN_BOTS) {
  for (const alias of [bot.id, bot.name, ...bot.aliases]) {
    BY_ALIAS.set(normalizeBotInput(alias), bot);
  }
}

export type ResolvedBot = {
  id: string;
  name: string;
  department: string;
  known: boolean;
  variant: Variant;
};

function prettyUnknown(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New bot";
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }
  return trimmed;
}

export function resolveBot(input: string): ResolvedBot {
  const norm = normalizeBotInput(input);
  const known = BY_ALIAS.get(norm);
  if (known) {
    return {
      id: known.id,
      name: known.name,
      department: known.department,
      known: true,
      variant: known.variant,
    };
  }
  const slug = norm.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bot";
  return {
    id: `visitor-${slug}`,
    name: prettyUnknown(input),
    department: "Visiting",
    known: false,
    variant: "generic",
  };
}

const EVERYONE_NAMES = new Set(["everyone", "big brain", "all", "crew", "the crew"]);

export function canonicalBotId(input: string): string {
  const norm = normalizeBotInput(input);
  if (EVERYONE_NAMES.has(norm)) return "everyone";
  return resolveBot(input).id;
}

export function profileFor(id: string): BotProfile | undefined {
  return BY_ID.get(id);
}

export function variantFor(id: string): Variant {
  return BY_ID.get(id)?.variant ?? "generic";
}

export function hueFor(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 360;
}

export function accentFor(id: string): string {
  switch (id) {
    case "ms-boone":
      return "#c4b5fd";
    case "ms-bhon":
      return "#fb923c";
    case "mr-prendagas":
      return "#60a5fa";
    case "coach-bates":
      return "#4ade80";
    default:
      return `hsl(${hueFor(id)} 78% 62%)`;
  }
}

export const TYPE_META: Record<
  EventType,
  { label: string; chip: string; bubble: string }
> = {
  learned: {
    label: "Learned",
    chip: "bg-amber-200/15 text-amber-100",
    bubble: "bg-amber-50 text-amber-950",
  },
  task_started: {
    label: "Started",
    chip: "bg-sky-200/15 text-sky-100",
    bubble: "bg-sky-50 text-sky-950",
  },
  task_done: {
    label: "Done",
    chip: "bg-emerald-200/15 text-emerald-100",
    bubble: "bg-emerald-50 text-emerald-950",
  },
  message: {
    label: "Note",
    chip: "bg-fuchsia-200/15 text-fuchsia-100",
    bubble: "bg-fuchsia-50 text-fuchsia-950",
  },
  alert: {
    label: "Alert",
    chip: "bg-rose-200/15 text-rose-100",
    bubble: "bg-rose-50 text-rose-950",
  },
};

/** Lines the crew actually checks in with. Demo mode cycles these. */
export const DEMO_SCRIPT: Array<{ bot: string; type: EventType; text: string }> = [
  { bot: "ms boone", type: "learned", text: "Psych grade checked" },
  { bot: "ms bhon", type: "learned", text: "Ethnic Studies grade checked" },
  { bot: "mr prendagas", type: "learned", text: "Gov grade checked" },
  { bot: "coach bates", type: "learned", text: "PE grade checked" },
  { bot: "ms boone", type: "message", text: "Edpuzzle/assignment found" },
  { bot: "ms bhon", type: "alert", text: "missing assignment found" },
  { bot: "mr prendagas", type: "message", text: "TCI/Classroom assignment found" },
  { bot: "coach bates", type: "alert", text: "dress-out reminder" },
  { bot: "ms boone", type: "learned", text: "study tip learned" },
  { bot: "ms bhon", type: "task_done", text: "YPAR done ✅" },
  { bot: "mr prendagas", type: "alert", text: "test or deadline reminder set" },
  { bot: "coach bates", type: "message", text: "assessment or tutorial coming up" },
];
