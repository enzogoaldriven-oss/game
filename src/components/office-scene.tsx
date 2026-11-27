"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GradePlaque } from "@/components/grade-plaque";
import { FloorWhiteboard } from "@/components/room-whiteboard";
import { accentFor, hueFor, profileFor, TYPE_META, variantFor } from "@/lib/bots";
import { CLASSES, todoMatchesClass } from "@/lib/classes";
import {
  BRAIN,
  buildScene,
  HOMES,
  project,
  ROOM_SIGNS,
  WHITEBOARDS,
  WORLD_H,
  WORLD_W,
} from "@/lib/iso";
import { createSim, ingest, linkGeometry, stepSim, visualSignature, type NeuralLink, type Pose, type Sim } from "@/lib/sim";
import type { ClassGrade } from "@/lib/grade-format";
import type { ClientEvent, EventType, GradeTodo } from "@/lib/types";
import { BigBrain } from "@/components/big-brain";
import { MinionSprite } from "@/components/minion-sprite";
import { Button } from "@/components/ui/button";

type DrawBot = {
  id: string;
  name: string;
  x: number;
  y: number;
  pose: Pose;
  facing: 1 | -1;
  carrying: boolean;
  bulb: boolean;
  bubble: string | null;
  bubbleKind: EventType | null;
  nonce: number;
  status: string;
};

type ReplyBubble = { text: string; nonce: number };

function initialBots(): DrawBot[] {
  return Object.entries(HOMES).map(([id, home]) => ({
    id,
    name: profileFor(id)?.name ?? id,
    x: home.desk.x,
    y: home.desk.y,
    pose: "idle",
    facing: 1,
    carrying: false,
    bulb: false,
    bubble: null,
    bubbleKind: null,
    nonce: 0,
    status: "In the department",
  }));
}

const STARS = Array.from({ length: 42 }, (_, index) => ({
  left: `${(index * 67) % 100}%`,
  top: `${(index * 41) % 100}%`,
  size: (index % 3) + 1,
  delay: (index % 8) * 0.35,
}));

export function OfficeScene({
  events,
  selectedId,
  onSelect,
  onOpenBrain,
  onOpenWhiteboard,
  onFiled,
  onStatuses,
  notes,
  replyBubbles,
  todos,
  grades,
  gradesUpdating,
}: {
  events: ClientEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenBrain: () => void;
  onOpenWhiteboard: (classId: string) => void;
  onFiled: (id: string) => void;
  onStatuses: (statuses: Record<string, string>) => void;
  notes: number;
  replyBubbles: Record<string, ReplyBubble | undefined>;
  todos: GradeTodo[];
  grades: ClassGrade[];
  gradesUpdating: boolean;
}) {
  const eventsRef = useRef(events);
  const onFiledRef = useRef(onFiled);
  const onStatusesRef = useRef(onStatuses);
  const scaleRef = useRef(1);
  const sigRef = useRef("");

  const [drawBots, setDrawBots] = useState<DrawBot[]>(initialBots);
  const [links, setLinks] = useState<NeuralLink[]>([]);
  const [pulse, setPulse] = useState(0);
  const reducedRef = useRef(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [vp, setVp] = useState({ w: 1100, h: 720 });
  const brain = project(BRAIN.x, BRAIN.y);
  const [focus, setFocus] = useState({ x: brain.sx, y: brain.sy - 20 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const brainWrapRef = useRef<HTMLDivElement>(null);

  const visitorIds = useMemo(() => {
    const ids: string[] = [];
    for (const event of events) {
      if (!HOMES[event.bot] && !ids.includes(event.bot)) ids.push(event.bot);
    }
    return ids;
  }, [events]);

  const scene = useMemo(() => buildScene(visitorIds.map((id) => hueFor(id))), [visitorIds]);

  const fit = Math.min(vp.w / WORLD_W, vp.h / WORLD_H);
  const zoomed = fit < 0.5;
  const scale = Math.min(Math.max(zoomed ? 0.6 : fit * 0.98, 0.32), 1.2);
  const inverse = 1 / scale;
  useLayoutEffect(() => {
    eventsRef.current = events;
    onFiledRef.current = onFiled;
    onStatusesRef.current = onStatuses;
    scaleRef.current = scale;
  }, [events, onFiled, onStatuses, scale]);
  const cameraX = zoomed ? vp.w / 2 - focus.x * scale : (vp.w - WORLD_W * scale) / 2;
  const cameraY = zoomed ? vp.h / 2 - focus.y * scale : (vp.h - WORLD_H * scale) / 2;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setVp({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 2800);
    return () => window.clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = media.matches;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const sim: Sim = createSim();
    let frame = 0;
    const loop = (now: number) => {
      ingest(sim, eventsRef.current);
      sim.reduced = reducedRef.current;
      stepSim(sim, now);
      const bots = sim.bots.map((bot) => ({
        id: bot.id,
        name: profileFor(bot.id)?.name ?? eventsRef.current.find((event) => event.bot === bot.id)?.botName ?? "Visitor",
        x: bot.x,
        y: bot.y,
        pose: bot.pose,
        facing: bot.facing,
        carrying: bot.carrying,
        bulb: bot.bulb,
        bubble: bot.bubble,
        bubbleKind: bot.bubbleKind,
        nonce: bot.nonce,
        status: bot.status,
      }));
      setDrawBots(bots);
      setLinks(sim.links.map((link) => ({ ...link, from: { ...link.from }, to: { ...link.to } })));
      const signature = visualSignature(sim);
      if (signature !== sigRef.current) {
        sigRef.current = signature;
        onStatusesRef.current(Object.fromEntries(sim.bots.map((bot) => [bot.id, bot.status])));
      }
      if (sim.filed.length > 0) {
        const batch = sim.filed.slice();
        setPulse((value) => value + batch.length);
        setBanner(batch[batch.length - 1]?.text ?? null);
        for (const item of batch) onFiledRef.current(item.id);
        const node = brainWrapRef.current;
        if (node && !reducedRef.current) {
          node.classList.remove("is-pulsing");
          void node.offsetWidth;
          node.classList.add("is-pulsing");
        }
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function panTo(x: number, y: number) {
    const point = project(x, y);
    setFocus({ x: point.sx, y: point.sy });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!zoomed) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = focus;
    const move = (pointer: PointerEvent) => {
      const dx = pointer.clientX - startX;
      const dy = pointer.clientY - startY;
      setFocus({
        x: clamp(origin.x - dx / scaleRef.current, 80, WORLD_W - 80),
        y: clamp(origin.y - dy / scaleRef.current, 80, WORLD_H - 80),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const directory = [
    ...Object.keys(HOMES).map((id) => ({ id, label: profileFor(id)?.short ?? id })),
    ...visitorIds.map((id) => ({
      id,
      label: events.find((event) => event.bot === id)?.botName ?? "Visitor",
    })),
  ];

  return (
    <div
      ref={viewportRef}
      className="relative h-full min-h-0 overflow-hidden"
      style={{ touchAction: zoomed ? "none" : "auto" }}
      onPointerDown={onPointerDown}
    >
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((star) => (
          <span
            key={`${star.left}-${star.top}`}
            className="star"
            style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: `${star.delay}s` }}
          />
        ))}
      </div>
      <div
        className="absolute left-0 top-0"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${cameraX}px, ${cameraY}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <svg width={WORLD_W} height={WORLD_H} className="absolute inset-0" aria-hidden>
          <ellipse cx={brain.sx} cy={brain.sy + 10} rx="460" ry="180" fill="rgba(0,0,0,0.28)" />
          {scene.polys.map((poly, index) => (
            <polygon
              key={`${poly.kind}-${index}`}
              points={poly.points}
              fill={poly.fill}
              stroke={poly.kind === "floor" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"}
              strokeWidth={1}
            />
          ))}
          {scene.lines.map((line, index) => (
            <polyline key={index} points={line.points} fill="none" stroke={line.stroke} strokeWidth={line.width} />
          ))}
          {scene.dots.map((dot, index) => (
            <circle key={index} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} />
          ))}
        </svg>
        {WHITEBOARDS.map((spec) => {
          const subject = CLASSES.find((item) => item.id === spec.classId);
          if (!subject) return null;
          return (
            <FloorWhiteboard
              key={spec.classId}
              spec={spec}
              subject={subject}
              todos={todos.filter((todo) => todoMatchesClass(todo, subject))}
              onOpen={() => {
                onOpenWhiteboard(spec.classId);
                if (zoomed) {
                  const at = spec.axis === "x" ? { x: spec.x + spec.w / 2, y: spec.y } : { x: spec.x, y: spec.y + spec.w / 2 };
                  panTo(at.x, at.y);
                }
              }}
            />
          );
        })}
        {WHITEBOARDS.map((spec) => {
          const subject = CLASSES.find((item) => item.id === spec.classId);
          if (!subject) return null;
          const grade = grades.find((item) => item.bot === subject.botId || item.classId === subject.id) ?? null;
          return <GradePlaque key={`grade-${spec.classId}`} spec={spec} grade={grade} updating={gradesUpdating} />;
        })}
        {ROOM_SIGNS.map((sign) => {
          const point = project(sign.at.x, sign.at.y);
          return (
            <div
              key={sign.title}
              className="room-sign"
              style={{
                left: point.sx,
                top: point.sy,
                borderColor: sign.tone,
                transform: `translate(-50%, calc(-100% - 28px)) scale(${inverse})`,
              }}
            >
              <strong>{sign.title}</strong>
            </div>
          );
        })}
        <div ref={brainWrapRef} className="absolute left-0 top-0 z-[1100]" style={{ transform: `translate(${brain.sx}px, ${brain.sy}px)` }}>
          <button
            type="button"
            className="brain-hit"
            style={{ transform: "translate(-50%, -92%)" }}
            onClick={onOpenBrain}
            aria-label="Open the Big Brain. Filed notes and open grade tasks."
          >
            <BigBrain pulse={pulse} />
          </button>
          <div className="brain-count" style={{ transform: `translate(-50%, 6px) scale(${inverse})` }}>
            {notes} {notes === 1 ? "note" : "notes"} filed
          </div>
          {banner ? (
            <div className="brain-banner" style={{ transform: `translate(-50%, -268px) scale(${inverse})` }}>
              {banner}
            </div>
          ) : null}
        </div>
        <svg className="pointer-events-none absolute inset-0 z-[1700]" width={WORLD_W} height={WORLD_H} aria-hidden>
          {links.map((link) => {
            const geometry = linkGeometry(link);
            return (
              <path
                key={link.id}
                d={geometry.d}
                fill="none"
                stroke={link.color}
                strokeWidth={7 * inverse}
                strokeLinecap="round"
                opacity={0.28}
              />
            );
          })}
          {links.map((link) => {
            const geometry = linkGeometry(link);
            return (
              <path
                key={`${link.id}-core`}
                d={geometry.d}
                fill="none"
                stroke={link.color}
                strokeWidth={2.2 * inverse}
                strokeLinecap="round"
                strokeDasharray={`${4 * inverse} ${9 * inverse}`}
              />
            );
          })}
        </svg>
        {links.flatMap((link) => {
          const geometry = linkGeometry(link);
          return geometry.stars.map((star, index) => (
            <div
              key={`${link.id}-star-${index}`}
              className="synapse-star"
              style={{
                left: star.sx,
                top: star.sy,
                width: star.r * 2,
                height: star.r * 2,
                color: link.color,
                transform: `translate(-50%, -50%) scale(${inverse})`,
              }}
            />
          ));
        })}
        {drawBots.map((bot) => {
          const point = project(bot.x, bot.y);
          const reply = replyBubbles[bot.id];
          const bubbleTone = bot.bubbleKind ? TYPE_META[bot.bubbleKind].bubble : "";
          const bubbleCopy = reply?.text ?? bot.bubble;
          const bubbleClass = reply ? "bubble bg-cyan-50 text-cyan-950" : `bubble ${bubbleTone}`;
          return (
            <div
              key={bot.id}
              data-bot={bot.id}
              data-selected={selectedId === bot.id ? "1" : "0"}
              className="actor"
              style={{ transform: `translate(${point.sx}px, ${point.sy}px)`, zIndex: 1200 + Math.round((bot.x + bot.y) * 20) }}
            >
              <button type="button" className="char-btn" onClick={() => onSelect(bot.id)} aria-label={`${bot.name}. ${bot.status}`}>
                <span className="nameplate" style={{ transform: `translate(-50%, 8px) scale(${inverse})` }}>
                  {bot.name}
                </span>
                <span key={reply?.nonce ?? bot.nonce} className={`bob pose-${bot.pose}`}>
                  {bubbleCopy ? (
                    <span className={bubbleClass} style={{ transform: `translate(-50%, 0) scale(${inverse})` }}>
                      {bubbleCopy}
                    </span>
                  ) : null}
                  {bot.bulb ? (
                    <span className="bulb" style={{ transform: `translate(-50%, 0) scale(${inverse})` }} aria-hidden>
                      💡
                    </span>
                  ) : null}
                  <span className={bot.facing < 0 ? "block -scale-x-100" : "block"}>
                    <MinionSprite variant={variantFor(bot.id)} hue={hueFor(bot.id)} badge={bot.name} />
                  </span>
                  {bot.carrying ? (
                    <span
                      className="carry-orb"
                      style={{
                        background: accentFor(bot.id),
                        color: accentFor(bot.id),
                        transform: `translate(-50%, 0) scale(${inverse})`,
                      }}
                    />
                  ) : null}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3 lg:top-auto lg:bottom-3">
        <div className="pointer-events-auto flex max-w-full flex-wrap justify-center gap-2">
          {directory.map((entry) => (
            <Button
              key={entry.id}
              type="button"
              size="sm"
              variant={selectedId === entry.id ? "default" : "outline"}
              onClick={() => {
                onSelect(entry.id);
                if (zoomed) {
                  const home = HOMES[entry.id];
                  if (home) panTo(home.desk.x, home.desk.y);
                  else panTo(BRAIN.x, BRAIN.y);
                }
              }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: accentFor(entry.id) }} />
              {entry.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenBrain();
              if (zoomed) panTo(BRAIN.x, BRAIN.y);
            }}
          >
            Big Brain
          </Button>
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
