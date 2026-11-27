import { accentFor } from "@/lib/bots";
import { BRAIN, HOMES, homeForVisitor, project, type Home, type Point } from "@/lib/iso";
import type { ClientEvent, EventType } from "@/lib/types";

export type Pose = "idle" | "walk" | "type" | "jump" | "alert";

type Arrive = "ambient" | "type" | "deposit" | "idle";

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
  mode: "idle" | "walk" | "react" | "type" | "deposit";
  until: number;
  path: Point[];
  arrive: Arrive;
  event: ClientEvent | null;
  home: Home;
};

export type FlyOrb = {
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
  orbs: FlyOrb[];
  seen: Set<string>;
  visitorPads: string[];
  filed: Array<{ id: string; text: string }>;
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
    orbs: [],
    seen: new Set(),
    visitorPads: [],
    filed: [],
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

function beginEvent(sim: Sim, bot: SimBot, event: ClientEvent) {
  bot.event = event;
  bot.bubble = bubbleText(event.text);
  bot.bubbleKind = event.type;
  bot.carrying = false;
  bot.bulb = false;
  if (event.type === "task_started") {
    bot.mode = "walk";
    bot.pose = "walk";
    bot.path = [bot.home.desk];
    bot.arrive = "type";
    bot.status = "Heading to the desk";
    return;
  }
  bot.mode = "react";
  bot.pose = event.type === "alert" ? "alert" : "jump";
  bot.bulb = event.type === "learned";
  bot.nonce += 1;
  bot.until = sim.time + (event.type === "learned" ? 1.05 : 0.82);
  bot.status = event.type === "alert" ? "Flagging it" : "Got something new";
}

function beginCarry(bot: SimBot) {
  bot.mode = "walk";
  bot.pose = "walk";
  bot.carrying = true;
  bot.bulb = false;
  bot.path = [...bot.home.toBrain];
  bot.arrive = "deposit";
  bot.status = "Carrying a note to the Big Brain";
}

function startDeposit(sim: Sim, bot: SimBot) {
  bot.mode = "deposit";
  bot.pose = "jump";
  bot.carrying = false;
  bot.nonce += 1;
  bot.status = "Filing it in the Big Brain";
  bot.until = sim.time + 1.4;
  if (!bot.event) return;
  sim.orbs.push({
    id: `orb-${bot.event.id}`,
    eventId: bot.event.id,
    botId: bot.id,
    text: bot.event.text,
    from: { x: bot.x, y: bot.y },
    to: { ...BRAIN },
    t: 0,
    color: accentFor(bot.id),
  });
}

function startReturn(bot: SimBot) {
  bot.mode = "walk";
  bot.pose = "walk";
  bot.carrying = false;
  bot.bulb = false;
  bot.bubble = null;
  bot.event = null;
  bot.status = "Heading back";
  const back = [...bot.home.toBrain].reverse().slice(1);
  const spot = bot.home.wander[Math.floor(Math.random() * bot.home.wander.length)] ?? bot.home.desk;
  bot.path = [...back, spot];
  bot.arrive = "idle";
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
    bot.until = sim.time + (bot.event ? 1.6 : 2.6);
    bot.status = bot.event ? "Working the new one" : "At the desk";
    return;
  }
  if (bot.arrive === "deposit") {
    startDeposit(sim, bot);
    return;
  }
  bot.mode = "idle";
  bot.pose = "idle";
  bot.carrying = false;
  bot.event = null;
  bot.bubble = null;
  bot.until = sim.time + 0.8 + Math.random() * (bot.arrive === "idle" ? 2.1 : 1.6);
  bot.status = "In the department";
}

function stepBot(sim: Sim, bot: SimBot, dt: number) {
  if (!bot.event && bot.queue.length > 0) {
    const next = bot.queue.shift();
    if (next) beginEvent(sim, bot, next);
  }

  switch (bot.mode) {
    case "idle":
      bot.pose = "idle";
      bot.carrying = false;
      bot.bulb = false;
      bot.status = "In the department";
      if (sim.time < bot.until) break;
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
    case "walk": {
      bot.pose = "walk";
      if (move(bot, dt)) finishWalk(sim, bot);
      break;
    }
    case "react":
      bot.pose = bot.bubbleKind === "alert" ? "alert" : "jump";
      bot.bulb = bot.bubbleKind === "learned";
      if (sim.time >= bot.until) beginCarry(bot);
      break;
    case "type":
      bot.pose = "type";
      if (sim.time >= bot.until) {
        if (bot.event) beginCarry(bot);
        else {
          bot.mode = "idle";
          bot.pose = "idle";
          bot.arrive = "ambient";
          bot.until = sim.time + 0.7 + Math.random() * 1.8;
          bot.status = "In the department";
        }
      }
      break;
    case "deposit":
      bot.pose = "jump";
      if (sim.time >= bot.until && !sim.orbs.some((orb) => orb.botId === bot.id)) {
        startReturn(bot);
      }
      break;
    default:
      break;
  }
}

function stepOrbs(sim: Sim, dt: number) {
  const staying: FlyOrb[] = [];
  for (const orb of sim.orbs) {
    orb.t += dt / 0.7;
    if (orb.t >= 1) {
      sim.filed.push({ id: orb.eventId, text: orb.text });
      const bot = sim.bots.find((item) => item.id === orb.botId);
      if (bot && bot.mode === "deposit" && bot.event?.id === orb.eventId) startReturn(bot);
      continue;
    }
    staying.push(orb);
  }
  sim.orbs = staying;
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
  stepOrbs(sim, dt);
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

export function orbScreen(orb: FlyOrb) {
  const start = project(orb.from.x, orb.from.y);
  const end = project(orb.to.x, orb.to.y);
  const from = { sx: start.sx, sy: start.sy - 86 };
  const to = { sx: end.sx, sy: end.sy - 78 };
  const control = {
    sx: (from.sx + to.sx) / 2,
    sy: Math.min(from.sy, to.sy) - 110,
  };
  const t = Math.min(1, orb.t);
  const u = 1 - t;
  return {
    sx: u * u * from.sx + 2 * u * t * control.sx + t * t * to.sx,
    sy: u * u * from.sy + 2 * u * t * control.sy + t * t * to.sy,
  };
}
