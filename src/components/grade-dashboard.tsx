"use client";

import { Button } from "@/components/ui/button";
import { CLASSES } from "@/lib/classes";
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

export function GradeDashboard({
  todos,
  loading,
  error,
  busyId,
  onToggle,
  onRetry,
}: {
  todos: GradeTodo[];
  loading: boolean;
  error: string | null;
  busyId: string | null;
  onToggle: (todo: GradeTodo, status: TodoStatus) => void;
  onRetry: () => void;
}) {
  const open = todos.filter((todo) => todo.status === "todo");
  const next = [...open].filter((todo) => todo.due).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0];
  const counts = CLASSES.map((subject) => ({
    ...subject,
    open: open.filter((todo) => todo.classId === subject.id).length,
  }));

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="How to raise my grades">
      <header className="border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-lg leading-none">How to raise my grades</h2>
        <p className="mt-2 text-sm font-extrabold text-cyan-100" aria-live="polite">
          {open.length} open
          {next?.due ? ` · next due ${formatDue(next.due)}` : ""}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {counts.map((subject) => (
            <li key={subject.id} className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-extrabold text-white/75">
              {subject.name} {subject.open}
            </li>
          ))}
        </ul>
        {next ? (
          <p className="mt-2 text-xs text-white/65">
            Next up: {next.title} · {next.className}
            {next.due ? ` · ${formatDue(next.due)}` : ""}
          </p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="space-y-2" aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : null}
        {!loading && error ? (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm">
            <p>{error}</p>
            <Button type="button" className="mt-3" size="sm" onClick={onRetry}>
              Try grades again
            </Button>
          </div>
        ) : null}
        {!loading && !error && todos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/75">
            No assignments yet. The crew posts them with the bot secret. Nothing here is filled in for you.
          </p>
        ) : null}
        {!loading && !error
          ? CLASSES.map((subject) => {
              const items = sortTodos(todos.filter((todo) => todo.classId === subject.id));
              return (
                <section key={subject.id} className="mb-4" aria-labelledby={`class-${subject.id}`}>
                  <h3 id={`class-${subject.id}`} className="px-1 text-sm font-extrabold">
                    {subject.name}
                    <span className="ml-2 font-bold text-white/50">{subject.teacher}</span>
                  </h3>
                  {items.length === 0 ? (
                    <p className="mt-1 px-1 text-xs text-white/45">Nothing in this class yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {items.map((todo) => (
                        <TodoRow key={todo.id} todo={todo} busy={busyId === todo.id} onToggle={onToggle} />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          : null}
      </div>
    </section>
  );
}
