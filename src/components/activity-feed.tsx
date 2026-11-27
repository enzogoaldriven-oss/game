"use client";

import { BotMedallion } from "@/components/minion-sprite";
import { Button } from "@/components/ui/button";
import { hueFor, TYPE_META, variantFor } from "@/lib/bots";
import type { ClientEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ActivityFeed({
  events,
  loading,
  error,
  demo,
  justFiledId,
  open,
  onToggle,
  onRetry,
  onSelect,
}: {
  events: ClientEvent[];
  loading: boolean;
  error: string | null;
  demo: boolean;
  justFiledId: string | null;
  open: boolean;
  onToggle: () => void;
  onRetry: () => void;
  onSelect: (id: string) => void;
}) {
  const rows = [...events].reverse();

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Activity">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="font-display text-lg leading-none">Activity</h2>
          <p className="mt-1 text-xs text-white/60">
            {demo ? "Simulate is on. These extra lines stay on this screen." : "Live notes from the crew"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={onToggle} aria-expanded={open}>
          {open ? "Hide" : "Show"}
        </Button>
      </header>
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-3", !open && "hidden lg:block")}>
        {loading ? (
          <div className="space-y-2" aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : null}
        {!loading && error ? (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm">
            <p>{error} The floor is still open.</p>
            <Button type="button" className="mt-3" size="sm" onClick={onRetry}>
              Try the log again
            </Button>
          </div>
        ) : null}
        {!loading && !error && rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/75">
            The log is quiet. The crew is pacing their rooms. Turn on Simulate, or have a bot POST a note to <span className="font-mono text-cyan-100">/api/events</span>.
          </div>
        ) : null}
        <ol className="space-y-2" aria-live="polite">
          {!loading &&
            rows.map((event) => {
              const meta = TYPE_META[event.type];
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(event.bot)}
                    className={cn(
                      "flex w-full gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5 text-left hover:bg-white/10",
                      event.id === justFiledId && "filed-flash",
                    )}
                  >
                    <BotMedallion variant={variantFor(event.bot)} hue={hueFor(event.bot)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-extrabold">{event.botName}</span>
                        <span className="shrink-0 text-[11px] text-white/50">{formatTime(event.createdAt)}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase", meta.chip)}>
                          {meta.label}
                        </span>
                        {event.simulated ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white/70 uppercase">
                            Sim
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-white/90">{event.text}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-cyan-100/80">
                        {event.delivery === "enroute" ? (
                          <>
                            <i className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-200" />
                            On the way to the Big Brain
                          </>
                        ) : (
                          "Filed in the Big Brain"
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
        </ol>
      </div>
    </section>
  );
}
