"use client";

import type { GradeTodo, TodoPriority, TodoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_RANK: Record<TodoPriority, number> = { high: 0, normal: 1, low: 2 };

const PRIORITY_CHIP: Record<TodoPriority, string> = {
  high: "bg-rose-200/20 text-rose-100",
  normal: "bg-white/10 text-white/80",
  low: "bg-white/5 text-white/50",
};

export function formatDue(due: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const [year, month, day] = due.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString([], { month: "short", day: "numeric" });
  }
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return due;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function sortTodos(todos: GradeTodo[]) {
  return [...todos].sort((a, b) => {
    if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
    const due = (a.due ?? "9999-99-99").localeCompare(b.due ?? "9999-99-99");
    if (due !== 0) return due;
    const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priority !== 0) return priority;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function TodoRow({
  todo,
  busy,
  onToggle,
}: {
  todo: GradeTodo;
  busy: boolean;
  onToggle: (todo: GradeTodo, status: TodoStatus) => void;
}) {
  const next = todo.status === "done" ? "todo" : "done";
  return (
    <li className={cn("rounded-2xl bg-white/6 px-3 py-2.5", todo.status === "done" && "opacity-60")}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-cyan-200"
          checked={todo.status === "done"}
          disabled={busy}
          aria-label={todo.status === "done" ? `Mark not done: ${todo.title}` : `Mark done: ${todo.title}`}
          onChange={() => onToggle(todo, next)}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-extrabold", todo.status === "done" && "line-through")}>{todo.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white/60">
            <span className="sr-only">{todo.className}. </span>
            <span className={cn("rounded-full px-2 py-0.5 uppercase", PRIORITY_CHIP[todo.priority])}>{todo.priority}</span>
            {todo.due ? <span>Due {formatDue(todo.due)}</span> : null}
            <span>{todo.status === "done" ? "Done" : "To do"}</span>
          </p>
          {todo.link ? (
            <a
              href={todo.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex min-h-10 items-center text-sm font-extrabold text-cyan-100 underline"
            >
              Open link
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
