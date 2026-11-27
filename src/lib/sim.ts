import { accentFor } from "@/lib/bots";
import { BRAIN, HOMES, homeForVisitor, project, type Home, type Point } from "@/lib/iso";
import type { ClientEvent, EventType } from "@/lib/types";

export type Pose = "idle" | "walk" | "type" | "jump" | "alert";

type Arrive = "ambient" | "type" | "react" | "idle";

export type SimBot = {
  id: string;
  x: number;
  y: number;
  facing: 1 | -1;
  pose: Pose;
  carrying: boolean;
  bulb: boolean;
  bubble: string | null;
  bubbleKind: EventType | null;
  status: string;
  nonce: number;
  queue: ClientEvent[];
  mode: "idle" | "walk" | "react" | "type" | "link";
  until: number;
  path: Point[];
  arrive: Arrive;
  event: ClientEvent | null;
  home: Home;
};

export type NeuralLink = {
  id: string;
  eventId: string;
  botId: string;
  text: string;
  from: Point;
  to: Point;
  t: number;
  color: string;
};

export type Sim = {
  time: number;
  lastRaf: number;
  bots: SimBot[];
  links: NeuralLink[];
  seen: Set<string>;
  visitorPads: string[];
  filed: Array<{ id: string; text: string }>;
  reduced: boolean;
};

const SPEED = 2.45;

function makeBot(id: string, home: Home, until: number): SimBot {
  return {
    id,
    x: home.desk.x,
    y: home.desk.y,
    facing: 1,
    pose: "idle",
    carrying: false,
    bulb: false,
    bubble: null,
    bubbleKind: null,
    status: "In the department",
    nonce: 0,
    queue: [],
    mode: "idle",
    until,
    path: [],
    arrive: "ambient",
    event: null,
    home,
  };
}

export function createSim(): Sim {
  return {
    time: 0,
    lastRaf: 0,
    bots: [
      makeBot("ms-boone", HOMES["ms-boone"], 0.35),
      makeBot("ms-bhon", HOMES["ms-bhon"], 0.7),
      makeBot("mr-prendagas", HOMES["mr-prendagas"], 1.05),
      makeBot("coach-bates", HOMES["coach-bates"], 1.4),
    ],
    links: [],
    seen: new Set(),
    visitorPads: [],
    filed: [],
    reduced: false,
  };
}

function ensureBot(sim: Sim, id: string): SimBot {
  const existing = sim.bots.find((bot) => bot.id === id);
  if (existing) return existing;
  const known = HOMES[id];
  let home = known;
  if (!home) {
    let pad = sim.visitorPads.indexOf(id);
    if (pad < 0) {
      pad = sim.visitorPads.length;
      sim.visitorPads.push(id);
    }
    home = homeForVisitor(pad);
  }
  const bot = makeBot(id, home, sim.time + 0.2);
  sim.bots.push(bot);
  return bot;
}

export function ingest(sim: Sim, events: ClientEvent[]) {
  for (const event of events) {
    if (sim.seen.has(event.id)) continue;
    sim.seen.add(event.id);
    const bot = ensureBot(sim, event.bot);
    if (event.delivery !== "enroute") continue;
    if (bot.event?.id === event.id || bot.queue.some((item) => item.id === event.id)) continue;
    bot.queue.push(event);
  }
}

function bubbleText(text: string) {
  return text.length > 86 ? `${text.slice(0, 84)}…` : text;
}

function atDesk(bot: SimBot) {
  return Math.hypot(bot.x - bot.home.desk.x, bot.y - bot.home.desk.y) < 0.08;
}

function park(bot: SimBot) {
  bot.x = bot.home.desk.x;
  bot.y = bot.home.desk.y;
  bot.path = [];
  bot.carrying = false;
}

function fireLink(sim: Sim, bot: SimBot) {
  if (!bot.event) {
    bot.mode = "idle";
    bot.pose = "idle";
    return;
  }
  park(bot);
  bot.mode = "link";
  bot.pose = sim.reduced ? "idle" : "type";
  bot.bulb = false;
  bot.status = "Beaming it to the Big Brain";
  sim.links.push({
    id: `link-${bot.event.id}`,
    eventId: bot.event.id,
    botId: bot.id,
    text: bot.event.text,
    from: { x: bot.home.desk.x, y: bot.home.desk.y },
    to: { ...BRAIN },
    t: 0,
    color: accentFor(bot.id),
  });
}

function startReact(sim: Sim, bot: SimBot) {
  const type = bot.event?.type;
  bot.mode = "react";
  bot.pose = type === "alert" ? "alert" : "jump";
  bot.bulb = type === "learned";
  bot.nonce += 1;
  bot.until = sim.time + (type === "learned" ? 0.7 : 0.5);
  bot.status = "Sending it to the Big Brain";
}

function beginEvent(sim: Sim, bot: SimBot, event: ClientEvent) {
  bot.event = event;
  bot.bubble = bubbleText(event.text);
  bot.bubbleKind = event.type;
  bot.carrying = false;
  bot.bulb = false;
  if (sim.reduced) {
    fireLink(sim, bot);
    return;
  }
  if (event.type === "task_started") {
    if (atDesk(bot)) {
      bot.mode = "type";
      bot.pose = "type";
      bot.until = sim.time + 1.5;
      bot.status = "Working the new one";
      return;
    }
    bot.mode = "walk";
    bot.pose = "walk";
    bot.path = [bot.home.desk];
    bot.arrive = "type";
    bot.status = "Heading to the desk";
    return;
  }
  if (!atDesk(bot)) {
    bot.mode = "walk";
    bot.pose = "walk";
    bot.path = [bot.home.desk];
    bot.arrive = "react";
    bot.status = "Back to the desk";
    return;
  }
  startReact(sim, bot);
}

function releaseBot(sim: Sim, bot: SimBot) {
  bot.mode = "idle";
  bot.pose = "idle";
  bot.event = null;
  bot.bubble = null;
  bot.bulb = false;
  bot.carrying = false;
  bot.until = sim.time + 0.45;
  bot.status = "In the department";
  if (bot.queue.length === 0) return;
  const next = bot.queue.shift();
  if (next) beginEvent(sim, bot, next);
}

function move(bot: SimBot, dt: number): boolean {
  const target = bot.path[0];
  if (!target) return true;
  const dx = target.x - bot.x;
  const dy = target.y - bot.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.045) {
    bot.x = target.x;
    bot.y = target.y;
    bot.path.shift();
    return bot.path.length === 0;
  }
  const step = Math.min(dist, SPEED * dt);
  const nextX = bot.x + (dx / dist) * step;
  const nextY = bot.y + (dy / dist) * step;
  const before = project(bot.x, bot.y);
  const after = project(nextX, nextY);
  if (Math.abs(after.sx - before.sx) > 0.35) {
    bot.facing = after.sx > before.sx ? 1 : -1;
  }
  bot.x = nextX;
  bot.y = nextY;
  return false;
}

function finishWalk(sim: Sim, bot: SimBot) {
  if (bot.arrive === "type") {
    bot.mode = "type";
    bot.pose = "type";
    bot.until = sim.time + (bot.event ? 1.5 : 2.2);
    bot.status = bot.event ? "Working the new one" : "At the desk";
    return;
  }
  if (bot.arrive === "react") {
    startReact(sim, bot);
    return;
  }
  bot.mode = "idle";
  bot.pose = "idle";
  bot.event = null;
  bot.bubble = null;
  bot.until = sim.time + 0.8 + Math.random() * 1.8;
  bot.status = "In the department";
}

function stepBot(sim: Sim, bot: SimBot, dt: number) {
  if (!bot.event && bot.queue.length > 0 && bot.mode !== "link") {
    const next = bot.queue.shift();
    if (next) beginEvent(sim, bot, next);
  }

  switch (bot.mode) {
    case "idle":
      bot.pose = "idle";
      bot.carrying = false;
      bot.bulb = false;
      bot.status = "In the department";
      if (sim.reduced || sim.time < bot.until) break;
      if (Math.random() < 0.3) {
        bot.mode = "walk";
        bot.pose = "walk";
        bot.path = [bot.home.desk];
        bot.arrive = "type";
        bot.status = "Walking to the desk";
      } else {
        const spot = bot.home.wander[Math.floor(Math.random() * bot.home.wander.length)] ?? bot.home.desk;
        bot.mode = "walk";
        bot.pose = "walk";
        bot.path = [spot];
        bot.arrive = "ambient";
        bot.status = "Walking the room";
      }
      break;
    case "walk":
      if (sim.reduced) {
        park(bot);
        bot.pose = "idle";
        if (bot.event) fireLink(sim, bot);
        else {
          bot.mode = "idle";
          bot.status = "In the department";
        }
        break;
      }
      bot.pose = "walk";
      if (move(bot, dt)) finishWalk(sim, bot);
      break;
    case "react":
      bot.pose = bot.bubbleKind === "alert" ? "alert" : "jump";
      bot.bulb = bot.bubbleKind === "learned";
      if (sim.time >= bot.until) fireLink(sim, bot);
      break;
    case "type":
      bot.pose = "type";
      if (sim.time >= bot.until) {
        if (bot.event) fireLink(sim, bot);
        else {
          bot.mode = "idle";
          bot.pose = "idle";
          bot.arrive = "ambient";
          bot.until = sim.time + 0.7 + Math.random() * 1.8;
          bot.status = "In the department";
        }
      }
      break;
    case "link":
      if (sim.links.some((link) => link.eventId === bot.event?.id)) {
        bot.pose = sim.reduced ? "idle" : "type";
        bot.status = "Beaming it to the Big Brain";
        break;
      }
      releaseBot(sim, bot);
      break;
    default:
      break;
  }
}

function stepLinks(sim: Sim, dt: number) {
  const staying: NeuralLink[] = [];
  for (const link of sim.links) {
    if (!sim.reduced) link.t += dt / 1.05;
    if (sim.reduced || link.t >= 1) {
      sim.filed.push({ id: link.eventId, text: link.text });
      continue;
    }
    staying.push(link);
  }
  sim.links = staying;
}

export function stepSim(sim: Sim, rafNow: number) {
  if (sim.lastRaf === 0) sim.lastRaf = rafNow;
  let dt = (rafNow - sim.lastRaf) / 1000;
  sim.lastRaf = rafNow;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  sim.time += dt;
  sim.filed = [];
  for (const bot of sim.bots) stepBot(sim, bot, dt);
  stepLinks(sim, dt);
}

export function visualSignature(sim: Sim) {
  return sim.bots
    .map((bot) =>
      [
        bot.id,
        bot.pose,
        bot.facing,
        bot.carrying ? 1 : 0,
        bot.bulb ? 1 : 0,
        bot.bubble ?? "",
        bot.nonce,
        bot.status,
      ].join("~"),
    )
    .join("|");
}

export function linkGeometry(link: NeuralLink) {
  const start = project(link.from.x, link.from.y);
  const end = project(link.to.x, link.to.y);
  const from = { sx: start.sx, sy: start.sy - 86 };
  const to = { sx: end.sx, sy: end.sy - 96 };
  const dx = to.sx - from.sx;
  const dy = to.sy - from.sy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bend = Math.min(150, len * 0.24);
  const c1 = { sx: from.sx + dx * 0.32 + nx * bend, sy: from.sy + dy * 0.18 + ny * bend - 36 };
  const c2 = { sx: from.sx + dx * 0.72 + nx * bend * 0.28, sy: from.sy + dy * 0.66 + ny * bend * 0.12 - 18 };
  const pointAt = (t: number) => {
    const clamped = Math.min(1, Math.max(0, t));
    const u = 1 - clamped;
    return {
      sx: u * u * u * from.sx + 3 * u * u * clamped * c1.sx + 3 * u * clamped * clamped * c2.sx + clamped * clamped * clamped * to.sx,
      sy: u * u * u * from.sy + 3 * u * u * clamped * c1.sy + 3 * u * clamped * clamped * c2.sy + clamped * clamped * clamped * to.sy,
    };
  };
  const travel = Math.min(1, Math.max(0, link.t));
  const stars = [0, 0.09, 0.18]
    .map((lag, index) => ({ t: travel - lag, r: index === 0 ? 6 : 3.5 }))
    .filter((star) => star.t > 0.03)
    .map((star) => ({ ...pointAt(star.t), r: star.r }));
  const d = `M ${from.sx} ${from.sy} C ${c1.sx} ${c1.sy}, ${c2.sx} ${c2.sy}, ${to.sx} ${to.sy}`;
  return { d, stars };
}
