export type ClassGrade = {
  bot: string;
  botName: string;
  classId: string;
  className: string;
  percent: number;
  letter: string;
  asOf: string;
  note: string | null;
  previousPercent: number | null;
  updatedAt: string;
};

export function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function letterTone(letter: string): "a" | "b" | "c" | "d" | "f" {
  const head = letter.trim().toUpperCase()[0];
  if (head === "A" || head === "B" || head === "C" || head === "D") return head.toLowerCase() as "a" | "b" | "c" | "d";
  return "f";
}
