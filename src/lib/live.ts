import type { ChatMessage, CrewEvent, GradeTodo } from "@/lib/types";

export type LiveFrame =
  | { kind: "event"; event: CrewEvent }
  | { kind: "todo"; action: "upsert"; todo: GradeTodo }
  | { kind: "todo"; action: "delete"; id: string }
  | { kind: "chat"; message: ChatMessage };

type Listener = (frame: LiveFrame) => void;

const KEY = "__crewHQLive";

type Bus = { listeners: Set<Listener> };

function bus(): Bus {
  const globalBus = globalThis as typeof globalThis & { [KEY]?: Bus };
  if (!globalBus[KEY]) globalBus[KEY] = { listeners: new Set() };
  return globalBus[KEY];
}

export function publish(frame: LiveFrame) {
  for (const listener of bus().listeners) {
    try {
      listener(frame);
    } catch (error) {
      console.error("Crew HQ listener failed", error);
    }
  }
}

export function subscribe(listener: Listener): () => void {
  const current = bus();
  current.listeners.add(listener);
  return () => current.listeners.delete(listener);
}
