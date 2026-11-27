export const EVENT_TYPES = [
  "learned",
  "task_started",
  "task_done",
  "message",
  "alert",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type CrewEvent = {
  id: string;
  bot: string;
  botName: string;
  department: string;
  known: boolean;
  type: EventType;
  text: string;
  createdAt: string;
};

export type ClientEvent = CrewEvent & {
  simulated?: boolean;
  delivery: "enroute" | "filed";
};

export const TODO_STATUSES = ["todo", "done"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TODO_PRIORITIES = ["low", "normal", "high"] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export type GradeTodo = {
  id: string;
  bot: string;
  botName: string;
  classId: string;
  className: string;
  title: string;
  due: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  link: string | null;
  createdAt: string;
  updatedAt: string;
};

export const EVERYONE_ID = "everyone";

export type ChatMessage = {
  id: string;
  from: string;
  fromName: string;
  to: string;
  text: string;
  timestamp: string;
  answered: boolean;
  replyTo: string | null;
};

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

export function isCrewEvent(value: unknown): value is CrewEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<CrewEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.bot === "string" &&
    typeof event.botName === "string" &&
    typeof event.department === "string" &&
    typeof event.known === "boolean" &&
    isEventType(event.type) &&
    typeof event.text === "string" &&
    typeof event.createdAt === "string"
  );
}
