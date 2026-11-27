"use client";

import { useEffect, useRef, useState } from "react";
import { MinionSprite } from "@/components/minion-sprite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { hueFor, variantFor } from "@/lib/bots";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChatTarget = {
  id: string;
  name: string;
  department: string;
  blurb: string;
  status: string;
};

function ChatComposer({ name, sending, onSend }: { name: string; sending: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div>
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = text.trim();
        if (!next || sending) return;
        onSend(next);
        setText("");
      }}
    >
      <label className="sr-only" htmlFor="crew-chat">
        Message {name}
      </label>
      <Input
        id="crew-chat"
        value={text}
        maxLength={500}
        placeholder={`Message ${name}`}
        onChange={(event) => setText(event.target.value)}
      />
      <Button type="submit" disabled={sending || text.trim().length === 0}>
        Send
      </Button>
    </form>
    <p className="mt-2 text-center text-xs font-bold text-white/55">Press Check now so the bots read your message.</p>
    </div>
  );
}

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatDrawer({
  target,
  messages,
  error,
  sending,
  onOpenChange,
  onSend,
}: {
  target: ChatTarget | null;
  messages: ChatMessage[];
  error: string | null;
  sending: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (text: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, target?.id]);

  return (
    <Sheet open={target !== null} onOpenChange={onOpenChange}>
      {target ? (
        <SheetContent
          title={target.name}
          description={target.department}
          footer={<ChatComposer key={target.id} name={target.name} sending={sending} onSend={onSend} />}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-3">
              {target.id !== "everyone" ? (
                <div className="bob pose-idle shrink-0 rounded-2xl bg-white/5 px-1 pt-2">
                  <MinionSprite variant={variantFor(target.id)} hue={hueFor(target.id)} badge={target.name} className="h-24 w-24" />
                </div>
              ) : null}
              <div>
                <p className="text-sm leading-snug text-white/80">{target.blurb}</p>
                <p className="mt-1 text-sm font-extrabold">{target.status}</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-white/55">Bots check in every few minutes.</p>
            {error ? <p className="mt-2 text-sm font-bold text-rose-200">{error}</p> : null}
            <div ref={scroller} className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-live="polite">
              {messages.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 text-sm text-white/70">
                  No messages yet. Say something real — this thread starts empty.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.from === "enzo";
                  const waiting = mine && !message.answered;
                  return (
                    <article
                      key={message.id}
                      className={cn("max-w-[92%] rounded-2xl px-3 py-2", mine ? "ml-auto bg-cyan-200 text-slate-950" : "bg-white/8")}
                    >
                      <p className="text-[11px] font-extrabold uppercase opacity-70">
                        {message.fromName} · {formatTime(message.timestamp)}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-snug">{message.text}</p>
                      {waiting ? (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700">
                          <i className="pulse-dot h-1.5 w-1.5 rounded-full bg-slate-700" />
                          Waiting for a reply
                        </p>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
