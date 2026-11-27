"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { formatDue, sortTodos } from "@/components/grade-dashboard";
import type { ClassInfo } from "@/lib/classes";
import type { GradeTodo, TodoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WhiteboardZoom({
  subject,
  todos,
  busyId,
  error,
  onClose,
  onToggle,
  onRetry,
}: {
  subject: ClassInfo | null;
  todos: GradeTodo[];
  busyId: string | null;
  error: string | null;
  onClose: () => void;
  onToggle: (todo: GradeTodo, status: TodoStatus) => void;
  onRetry: () => void;
}) {
  const items = subject ? sortTodos(todos.filter((todo) => todo.classId === subject.id)) : [];
  const openCount = items.filter((todo) => todo.status === "todo").length;

  return (
    <Dialog.Root open={subject !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#05060f]/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[81] flex items-center justify-center p-3 outline-none sm:p-8">
          {subject ? (
            <div className="whiteboard-frame w-full max-w-3xl" data-ink={subject.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="font-marker text-4xl leading-none text-slate-800">{subject.name}</Dialog.Title>
                  <Dialog.Description className="font-marker mt-1 text-xl text-slate-600">
                    {subject.teacher} · {openCount} open
                  </Dialog.Description>
                </div>
                <Dialog.Close className="grid h-11 w-11 place-items-center rounded-full bg-slate-800/10 text-slate-800" aria-label="Close whiteboard">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <div className="whiteboard-surface font-marker">
                {error ? (
                  <div className="text-lg text-rose-700">
                    <p>{error}</p>
                    <button type="button" className="mt-2 underline" onClick={onRetry}>
                      Try again
                    </button>
                  </div>
                ) : null}
                {!error && items.length === 0 ? (
                  <p className="text-2xl text-slate-500">The board is clear.</p>
                ) : null}
                <ul className="space-y-3">
                  {items.map((todo) => {
                    const done = todo.status === "done";
                    return (
                      <li key={todo.id}>
                        <label className={cn("flex items-start gap-3 text-2xl leading-tight", done && "text-slate-400 line-through")}>
                          <input
                            type="checkbox"
                            className="whiteboard-check mt-1"
                            checked={done}
                            disabled={busyId === todo.id}
                            onChange={() => onToggle(todo, done ? "todo" : "done")}
                          />
                          <span>
                            {todo.title}
                            {todo.due ? <span className="ml-2 text-lg text-slate-500">due {formatDue(todo.due)}</span> : null}
                            {todo.link ? (
                              <a href={todo.link} target="_blank" rel="noreferrer" className="ml-2 text-lg underline">
                                link
                              </a>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="whiteboard-tray" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
