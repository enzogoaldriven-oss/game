"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ActivityFeed } from "@/components/activity-feed";
import { BrainPanel } from "@/components/brain-panel";
import { ChatDrawer, type ChatTarget } from "@/components/chat-drawer";
import { GradeDashboard } from "@/components/grade-dashboard";
import { OfficeScene } from "@/components/office-scene";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DEMO_SCRIPT, profileFor, resolveBot } from "@/lib/bots";
import { EVERYONE_ID, type ChatMessage, type ClientEvent, type CrewEvent, type GradeTodo, type TodoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type LinkState = "connecting" | "live" | "reconnecting";
type MobilePanel = "closed" | "grades" | "activity";
type ReplyBubble = { text: string; nonce: number };

class LoginRequired extends Error {}

async function fetchEvents(): Promise<CrewEvent[]> {
  const response = await fetch("/api/events", { cache: "no-store" });
  if (response.status === 401) throw new LoginRequired();
  if (!response.ok) throw new Error("log unavailable");
  const data = (await response.json()) as { events?: CrewEvent[] };
  return data.events ?? [];
}

async function fetchTodos(): Promise<GradeTodo[]> {
  const response = await fetch("/api/todos", { cache: "no-store" });
  if (response.status === 401) throw new LoginRequired();
  if (!response.ok) throw new Error("grades unavailable");
  const data = (await response.json()) as { todos?: GradeTodo[] };
  return data.todos ?? [];
}

async function fetchChat(): Promise<ChatMessage[]> {
  const response = await fetch("/api/chat", { cache: "no-store" });
  if (response.status === 401) throw new LoginRequired();
  if (!response.ok) throw new Error("chat unavailable");
  const data = (await response.json()) as { messages?: ChatMessage[] };
  return data.messages ?? [];
}

function upsertTodo(list: GradeTodo[], todo: GradeTodo) {
  const index = list.findIndex((item) => item.id === todo.id);
  if (index < 0) return [...list, todo];
  const next = list.slice();
  next[index] = todo;
  return next;
}

function upsertMessage(list: ChatMessage[], message: ChatMessage) {
  const index = list.findIndex((item) => item.id === message.id);
  if (index < 0) return [...list, message];
  const next = list.slice();
  next[index] = message;
  return next;
}

function clip(text: string) {
  return text.length > 72 ? `${text.slice(0, 71)}…` : text;
}

export function CrewHQ() {
  const router = useRouter();
  const alive = useRef(true);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [todos, setTodos] = useState<GradeTodo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoError, setTodoError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [link, setLink] = useState<LinkState>("connecting");
  const demo = useSyncExternalStore(subscribeDemo, readDemo, () => false);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [justFiledId, setJustFiledId] = useState<string | null>(null);
  const [panel, setPanel] = useState<MobilePanel>("closed");
  const [busyTodo, setBusyTodo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyBubbles, setReplyBubbles] = useState<Record<string, ReplyBubble | undefined>>({});

  const mergeServer = useCallback((incoming: CrewEvent[]) => {
    setEvents((current) => {
      const map = new Map(current.map((event) => [event.id, event]));
      for (const event of incoming) {
        if (!map.has(event.id)) map.set(event.id, { ...event, delivery: "filed" });
      }
      return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-200);
    });
  }, []);

  const reload = useCallback(async () => {
    try {
      mergeServer(await fetchEvents());
      setError(null);
    } catch (reason) {
      if (reason instanceof LoginRequired) {
        router.refresh();
        return;
      }
      setError("The log didn't load.");
    }
    try {
      setTodos(await fetchTodos());
      setTodoError(null);
    } catch (reason) {
      if (reason instanceof LoginRequired) {
        router.refresh();
        return;
      }
      setTodoError("Grades didn't load.");
    }
    try {
      setMessages(await fetchChat());
      setChatError(null);
    } catch (reason) {
      if (reason instanceof LoginRequired) {
        router.refresh();
        return;
      }
      setChatError("Chat didn't load.");
    } finally {
      setLoading(false);
    }
  }, [mergeServer, router]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

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
      source.addEventListener("todo", (message) => {
        try {
          const frame = JSON.parse((message as MessageEvent).data) as
            | { action: "delete"; id: string }
            | { action: "upsert"; todo: GradeTodo };
          if (frame.action === "delete") {
            setTodos((current) => current.filter((todo) => todo.id !== frame.id));
            return;
          }
          setTodos((current) => upsertTodo(current, frame.todo));
        } catch {
          /* ignore malformed frames */
        }
      });
      source.addEventListener("chat", (message) => {
        try {
          const chat = JSON.parse((message as MessageEvent).data) as ChatMessage;
          setMessages((current) => upsertMessage(current, chat));
          if (chat.from === "enzo") return;
          const nonce = Date.now();
          setReplyBubbles((current) => ({ ...current, [chat.from]: { text: clip(chat.text), nonce } }));
          window.setTimeout(() => {
            if (!alive.current) return;
            setReplyBubbles((current) => {
              if (current[chat.from]?.nonce !== nonce) return current;
              const next = { ...current };
              delete next[chat.from];
              return next;
            });
          }, 7000);
        } catch {
          /* ignore malformed frames */
        }
      });
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

  const openChat = useCallback((id: string) => {
    setChatTarget(id);
    setBrainOpen(false);
    setChatError(null);
  }, []);

  const chat = useMemo<ChatTarget | null>(() => {
    if (!chatTarget) return null;
    if (chatTarget === EVERYONE_ID) {
      return {
        id: EVERYONE_ID,
        name: "Big Brain",
        department: "Everyone",
        blurb: "One thread for the whole crew.",
        status: "Anyone on the floor can answer.",
      };
    }
    const profile = profileFor(chatTarget);
    const sample = [...events].reverse().find((event) => event.bot === chatTarget);
    return {
      id: chatTarget,
      name: profile?.name ?? sample?.botName ?? "Visitor",
      department: profile?.department ?? sample?.department ?? "Visiting",
      blurb: profile?.blurb ?? "New helper. They clocked in with a note and took a spare pad.",
      status: statuses[chatTarget] ?? "On the floor",
    };
  }, [chatTarget, events, statuses]);

  const thread = useMemo(
    () => (chat ? messages.filter((message) => message.to === chat.id) : []),
    [chat, messages],
  );

  function toggleDemo(next: boolean) {
    writeDemo(next);
    if (!next) setEvents((current) => current.filter((event) => !event.simulated));
  }

  async function toggleTodo(todo: GradeTodo, status: TodoStatus) {
    setBusyTodo(todo.id);
    setTodoError(null);
    try {
      const response = await fetch(`/api/todos/${encodeURIComponent(todo.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.status === 401) {
        router.refresh();
        return;
      }
      if (!response.ok) {
        setTodoError("Couldn't update that item.");
        return;
      }
      const data = (await response.json()) as { todo: GradeTodo };
      setTodos((current) => upsertTodo(current, data.todo));
    } catch {
      setTodoError("Couldn't update that item.");
    } finally {
      setBusyTodo(null);
    }
  }

  async function sendChat(text: string) {
    if (!chatTarget || sending) return;
    setSending(true);
    setChatError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot: chatTarget, text }),
      });
      if (response.status === 401) {
        router.refresh();
        return;
      }
      if (!response.ok) {
        setChatError("Message didn't send.");
        return;
      }
      const data = (await response.json()) as { message: ChatMessage };
      setMessages((current) => upsertMessage(current, data.message));
    } catch {
      setChatError("Message didn't send.");
    } finally {
      setSending(false);
    }
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
            selectedId={chatTarget && chatTarget !== EVERYONE_ID ? chatTarget : null}
            onSelect={openChat}
            onOpenBrain={() => {
              setBrainOpen(true);
              setChatTarget(null);
            }}
            onFiled={onFiled}
            onStatuses={setStatuses}
            notes={notes}
            replyBubbles={replyBubbles}
          />
        </main>
        <aside
          className={cn(
            "flex min-h-0 shrink-0 flex-col border-white/10 bg-[#101226]/95 backdrop-blur-md lg:h-full lg:w-[400px] lg:border-t-0 lg:border-l",
            panel === "closed" ? "h-16 border-t" : "h-[min(72dvh,560px)] border-t",
          )}
        >
          <div className="flex shrink-0 items-center gap-2 px-3 py-2 lg:hidden">
            <Button
              type="button"
              size="sm"
              variant={panel === "grades" ? "default" : "outline"}
              aria-expanded={panel === "grades"}
              onClick={() => setPanel((current) => (current === "grades" ? "closed" : "grades"))}
            >
              Grades
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panel === "activity" ? "default" : "outline"}
              aria-expanded={panel === "activity"}
              onClick={() => setPanel((current) => (current === "activity" ? "closed" : "activity"))}
            >
              Activity
            </Button>
          </div>
          <div className={cn("min-h-0 flex-1 flex-col", panel === "grades" ? "flex" : "hidden", "lg:flex")}>
            <GradeDashboard
              todos={todos}
              loading={loading}
              error={todoError}
              busyId={busyTodo}
              onToggle={(todo, status) => void toggleTodo(todo, status)}
              onRetry={() => {
                setLoading(true);
                void reload();
              }}
            />
          </div>
          <div className={cn("min-h-0 flex-1 flex-col lg:h-[46%] lg:flex-none", panel === "activity" ? "flex" : "hidden", "lg:flex")}>
            <ActivityFeed
              events={events}
              loading={loading}
              error={error}
              demo={demo}
              justFiledId={justFiledId}
              open
              onToggle={() => setPanel("closed")}
              onRetry={() => {
                setLoading(true);
                void reload();
              }}
              onSelect={openChat}
            />
          </div>
        </aside>
      </div>
      <ChatDrawer
        target={chat}
        messages={thread}
        error={chatError}
        sending={sending}
        onOpenChange={(open) => {
          if (!open) setChatTarget(null);
        }}
        onSend={(text) => void sendChat(text)}
      />
      <BrainPanel
        open={brainOpen}
        events={events}
        todos={todos}
        busyId={busyTodo}
        onOpenChange={setBrainOpen}
        onOpenChat={openChat}
        onToggle={(todo, status) => void toggleTodo(todo, status)}
      />
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
