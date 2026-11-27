export type ClassInfo = {
  id: string;
  name: string;
  teacher: string;
  botId: string;
  aliases: string[];
};

export const CLASSES: ClassInfo[] = [
  {
    id: "psychology",
    name: "Psychology",
    teacher: "Ms Boone",
    botId: "ms-boone",
    aliases: ["psychology", "psych", "ms boone"],
  },
  {
    id: "ethnic-studies",
    name: "Ethnic Studies",
    teacher: "Ms Bhon",
    botId: "ms-bhon",
    aliases: ["ethnic studies", "ethnic-studies", "ethnicstudies", "ms bhon", "ms bohn", "msbhon", "msbohn", "bhon"],
  },
  {
    id: "gov-history",
    name: "Gov/History",
    teacher: "Mr Prendagas",
    botId: "mr-prendagas",
    aliases: [
      "gov/history",
      "gov / history",
      "gov",
      "history",
      "government",
      "history & government",
      "history and government",
      "history and gov",
      "gov history",
      "history/gov",
      "history / gov",
      "mr prendagas",
    ],
  },
  {
    id: "pe",
    name: "PE",
    teacher: "Coach Bates",
    botId: "coach-bates",
    aliases: ["pe", "physical education", "coach bates"],
  },
];

export function normalizeClass(value: string): string {
  let text = value.trim().toLowerCase().replace(/\./g, "");
  text = text.replace(/[_-]+/g, " ");
  text = text.replace(/\s*\/\s*/g, "/");
  text = text.replace(/\s+/g, " ").trim();
  while (text.startsWith("visitor ")) text = text.slice("visitor ".length).trim();
  return text;
}

export function resolveClass(value: unknown): ClassInfo | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const norm = normalizeClass(value);
  return (
    CLASSES.find(
      (item) =>
        item.aliases.includes(norm) ||
        normalizeClass(item.name) === norm ||
        normalizeClass(item.id) === norm ||
        normalizeClass(item.botId) === norm,
    ) ?? null
  );
}

export function todoMatchesClass(
  todo: { classId: string; className: string; bot: string },
  subject: ClassInfo,
): boolean {
  if (todo.classId === subject.id || todo.bot === subject.botId) return true;
  return resolveClass(todo.className)?.id === subject.id || resolveClass(todo.bot)?.id === subject.id;
}
