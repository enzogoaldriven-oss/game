"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ActivityFeed } from "@/components/activity-feed";
import { MinionSprite } from "@/components/minion-sprite";
import { OfficeScene } from "@/components/office-scene";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { DEMO_SCRIPT, hueFor, profileFor, resolveBot, variantFor } from "@/lib/bots";
import type { ClientEvent, CrewEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type LinkState = "connecting" | "live" | "reconnecting";

class LoginRequired extends Error {}

async function fetchEvents(): Promise<CrewEvent[]> {
  const response = await fetch("/api/events", { cache: "no-store" });
  if (response.status === 401) throw new LoginRequired();
  if (!response.ok) throw new Error("log unavailable");
  const data = (await response.json()) as { events?: CrewEvent[] };
  return data.events ?? [];
}

export function CrewHQ() {
  const router = useRouter();
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<LinkState>("connecting");
  const demo = useSyncExternalStore(subscribeDemo, readDemo, () => false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [justFiledId, setJustFiledId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(true);

  const mergeServer = useCallback((incoming: CrewEvent[]) => {
    setEvents((current) => {
      const map = new Map(current.map((event) => [event.id, event]));
      for (const event of incoming) {
        if (!map.has(event.id)) {
          const filed: ClientEvent = { ...event, delivery: "filed" };
          map.set(event.id, filed);
        }
      }
      return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-200);
    });
  }, []);

  const reload = useCallback(async () => {
    try {
      const incoming = await fetchEvents();
      mergeServer(incoming);
      setError(null);
    } catch (error) {
      if (error instanceof LoginRequired) {
        router.refresh();
        return;
      }
      setError("The log didn't load.");
    } finally {
      setLoading(false);
    }
  }, [mergeServer, router]);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;
    void (async () => {
      await reload();
      if (cancelled) return;
      source = new EventSource("/api/events/stream");
      source.onopen = () => {
        setLink("live");
        void reload();
      };
      source.onerror = () => {
        setLink("reconnecting");
        void fetch("/api/events", { cache: "no-store" }).then((response) => {
          if (response.status === 401) router.refresh();
        });
      };
      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as CrewEvent;
          const live: ClientEvent = { ...event, delivery: "enroute" };
          setEvents((current) => {
            if (current.some((item) => item.id === live.id)) return current;
            return [...current, live].slice(-200);
          });
        } catch {
          /* ignore malformed frames */
        }
      };
    })();
    return () => {
      cancelled = true;
      source?.close();
    };
  }, [reload, router]);

  useEffect(() => {
    if (!demo) return;
    let index = 0;
    const push = () => {
      const item = DEMO_SCRIPT[index % DEMO_SCRIPT.length];
      index += 1;
      const identity = resolveBot(item.bot);
      const event: ClientEvent = {
        id: `sim-${crypto.randomUUID()}`,
        bot: identity.id,
        botName: identity.name,
        department: identity.department,
        known: identity.known,
        type: item.type,
        text: item.text,
        createdAt: new Date().toISOString(),
        simulated: true,
        delivery: "enroute",
      };
      setEvents((current) => [...current, event].slice(-200));
    };
    const first = window.setTimeout(push, 700);
    const timer = window.setInterval(push, 4300);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [demo]);

  useEffect(() => {
    if (!justFiledId) return;
    const timer = window.setTimeout(() => setJustFiledId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [justFiledId]);

  const onFiled = useCallback((id: string) => {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, delivery: "filed" } : event)));
    setJustFiledId(id);
  }, []);

  const notes = events.filter((event) => event.delivery === "filed").length;
  const selected = useMemo(() => {
    if (!selectedId) return null;
    const profile = profileFor(selectedId);
    const sample = [...events].reverse().find((event) => event.bot === selectedId);
    return {
      id: selectedId,
      name: profile?.name ?? sample?.botName ?? "Visitor",
      department: profile?.department ?? sample?.department ?? "Visiting",
      blurb: profile?.blurb ?? "New helper. They clocked in with a note and took a spare pad.",
      recent: events.filter((event) => event.bot === selectedId).slice(-8).reverse(),
    };
  }, [events, selectedId]);

  function toggleDemo(next: boolean) {
    writeDemo(next);
  }

  const linkCopy = link === "live" ? "Live" : link === "reconnecting" ? "Reconnecting" : "Linking";

  return (
    <div className="flex h-dvh flex-col bg-[#07091a] text-white">
      <header className="z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-[#101226]/90 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="min-w-0">
          <p className="font-display text-xl leading-none sm:text-2xl">The Crew HQ</p>
          <p className="mt-1 truncate text-xs text-white/65 sm:text-sm">Enzo&apos;s helpers, on the floor</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold",
              link === "live" && "text-emerald-200",
              link === "reconnecting" && "text-rose-200",
              link === "connecting" && "text-amber-100",
            )}
          >
            <i
              className={cn(
                "h-2 w-2 rounded-full",
                link === "live" && "bg-emerald-300",
                link === "reconnecting" && "bg-rose-300",
                link === "connecting" && "bg-amber-200",
              )}
            />
            {linkCopy}
          </span>
          <label className="flex items-center gap-2 text-sm font-extrabold" htmlFor="simulate">
            <span className="hidden sm:inline">Simulate</span>
            <span className="sm:hidden">Sim</span>
            <Switch id="simulate" checked={demo} onCheckedChange={toggleDemo} aria-label="Simulate crew activity" />
          </label>
          <form action="/api/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Lock
            </Button>
          </form>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_center,#1c2454_0%,#0b1024_58%,#07091a_100%)]">
          <OfficeScene
            events={events}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onFiled={onFiled}
            onStatuses={setStatuses}
            notes={notes}
          />
        </main>
        <aside
          className={cn(
            "shrink-0 border-white/10 bg-[#101226]/95 backdrop-blur-md lg:h-auto lg:w-[400px] lg:border-t-0 lg:border-l",
            logOpen ? "h-[248px] border-t" : "h-14 border-t",
          )}
        >
          <ActivityFeed
            events={events}
            loading={loading}
            error={error}
            demo={demo}
            justFiledId={justFiledId}
            open={logOpen}
            onToggle={() => setLogOpen((value) => !value)}
            onRetry={() => {
              setLoading(true);
              void reload();
            }}
            onSelect={setSelectedId}
          />
        </aside>
      </div>
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selected ? (
          <SheetContent title={selected.name} description={selected.department}>
            <div className="flex items-end gap-4">
              <div className="bob pose-idle rounded-3xl bg-white/5 px-2 pt-3">
                <MinionSprite
                  variant={variantFor(selected.id)}
                  hue={hueFor(selected.id)}
                  badge={selected.name}
                  className="h-[168px] w-[160px]"
                />
              </div>
              <div className="pb-3">
                <p className="text-xs font-extrabold tracking-[0.14em] text-cyan-100/80 uppercase">{selected.department}</p>
                <p className="mt-2 text-sm leading-snug text-white/80">{selected.blurb}</p>
                <p className="mt-3 text-sm font-extrabold text-white">{statuses[selected.id] ?? "On the floor"}</p>
              </div>
            </div>
            <h3 className="mt-6 font-display text-lg">Recent check-ins</h3>
            {selected.recent.length === 0 ? (
              <p className="mt-2 text-sm text-white/65">Nothing filed yet. They&apos;re still settling in.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selected.recent.map((event) => (
                  <li key={event.id} className="rounded-2xl bg-white/6 px-3 py-2">
                    <p className="text-sm font-bold">{event.text}</p>
                    <p className="mt-1 text-[11px] font-bold text-white/50">
                      {TYPE_LABEL[event.type]}
                      {event.simulated ? " · sim" : ""} · {event.delivery === "filed" ? "filed" : "on the way"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}

function subscribeDemo(callback: () => void) {
  window.addEventListener("crew-hq-demo", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("crew-hq-demo", callback);
    window.removeEventListener("storage", callback);
  };
}

function readDemo() {
  return window.localStorage.getItem("crew-hq-demo") === "on";
}

function writeDemo(next: boolean) {
  window.localStorage.setItem("crew-hq-demo", next ? "on" : "off");
  window.dispatchEvent(new Event("crew-hq-demo"));
}

const TYPE_LABEL = {
  learned: "Learned",
  task_started: "Started",
  task_done: "Done",
  message: "Note",
  alert: "Alert",
} as const;
