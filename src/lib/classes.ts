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
    aliases: ["ethnic studies", "ethnic-studies", "ms bhon"],
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
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");
}

export function resolveClass(value: unknown): ClassInfo | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const norm = normalizeClass(value);
  return CLASSES.find((item) => item.aliases.includes(norm)) ?? null;
}
