"use client";

import { TodoRow, formatDue, sortTodos } from "@/components/grade-dashboard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CLASSES } from "@/lib/classes";
import { profileFor } from "@/lib/bots";
import type { ClientEvent, GradeTodo, TodoStatus } from "@/lib/types";

const CREW_ORDER = ["ms-boone", "ms-bhon", "mr-prendagas", "coach-bates"];

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function BrainPanel({
  open,
  events,
  todos,
  busyId,
  onOpenChange,
  onOpenChat,
  onToggle,
}: {
  open: boolean;
  events: ClientEvent[];
  todos: GradeTodo[];
  busyId: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenChat: (botId: string) => void;
  onToggle: (todo: GradeTodo, status: TodoStatus) => void;
}) {
  const filed = events.filter((event) => event.delivery === "filed");
  const openTodos = sortTodos(todos.filter((todo) => todo.status === "todo"));
  const groups = new Map<string, ClientEvent[]>();
  for (const event of filed) {
    const list = groups.get(event.bot) ?? [];
    list.push(event);
    groups.set(event.bot, list);
  }
  const botIds = [...groups.keys()].sort((a, b) => {
    const ai = CREW_ORDER.indexOf(a);
    const bi = CREW_ORDER.indexOf(b);
    const ar = ai === -1 ? 99 : ai;
    const br = bi === -1 ? 99 : bi;
    if (ar !== br) return ar - br;
    return (groups.get(a)?.[0]?.botName ?? a).localeCompare(groups.get(b)?.[0]?.botName ?? b);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SheetContent
          title="Big Brain"
          description={`${filed.length} filed · ${openTodos.length} open`}
          footer={
            <Button type="button" className="w-full" onClick={() => onOpenChat("everyone")}>
              Message the crew
            </Button>
          }
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
            <section aria-labelledby="brain-open">
              <h3 id="brain-open" className="font-display text-lg">
                Open grade work
              </h3>
              {openTodos.length === 0 ? (
                <p className="mt-2 text-sm text-white/65">No open assignments.</p>
              ) : (
                CLASSES.map((subject) => {
                  const items = openTodos.filter((todo) => todo.classId === subject.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={subject.id} className="mt-3">
                      <h4 className="text-xs font-extrabold tracking-wide text-white/55 uppercase">
                        {subject.name} · {subject.teacher}
                      </h4>
                      <ul className="mt-2 space-y-2">
                        {items.map((todo) => (
                          <TodoRow key={todo.id} todo={todo} busy={busyId === todo.id} onToggle={onToggle} />
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </section>
            <section aria-labelledby="brain-filed">
              <h3 id="brain-filed" className="font-display text-lg">
                Filed notes
              </h3>
              {botIds.length === 0 ? (
                <p className="mt-2 text-sm text-white/65">No notes filed yet. A real check-in lands here after the beam hits.</p>
              ) : (
                botIds.map((botId) => {
                  const notes = groups.get(botId) ?? [];
                  const name = notes[0]?.botName ?? profileFor(botId)?.name ?? "Visitor";
                  const department = notes[0]?.department ?? profileFor(botId)?.department ?? "Visiting";
                  return (
                    <div key={botId} className="mt-3">
                      <button type="button" className="text-left" onClick={() => onOpenChat(botId)}>
                        <span className="font-extrabold">{name}</span>
                        <span className="ml-2 text-xs font-bold text-white/50">{department}</span>
                      </button>
                      <ul className="mt-2 space-y-2">
                        {notes
                          .slice()
                          .reverse()
                          .map((event) => (
                            <li key={event.id}>
                              <button
                                type="button"
                                onClick={() => onOpenChat(botId)}
                                className="w-full rounded-2xl bg-white/6 px-3 py-2 text-left hover:bg-white/10"
                              >
                                <span className="block text-sm font-bold">{event.text}</span>
                                <span className="mt-1 block text-[11px] font-bold text-white/50">
                                  {formatTime(event.createdAt)}
                                  {event.simulated ? " · sim" : ""}
                                </span>
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </section>
            {openTodos.some((todo) => todo.due) ? (
              <p className="text-xs text-white/50">
                Next due{" "}
                {formatDue(
                  [...openTodos].filter((todo) => todo.due).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0]?.due ?? "",
                )}
              </p>
            ) : null}
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
