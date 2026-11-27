export const TILE_W = 72;
export const TILE_H = 36;
const HW = TILE_W / 2;
const HH = TILE_H / 2;
const MAP_MAX = 16;
const PAD_X = 96;
const PAD_TOP = 196;
const PAD_BOTTOM = 88;

export type Point = { x: number; y: number };

export type Home = {
  desk: Point;
  wander: Point[];
  toBrain: Point[];
};

export type RoomId = "psych" | "ethnic" | "gov" | "pe" | "atrium" | "visitor";

type Tile = { x: number; y: number; room: RoomId; hue?: number };

export type Poly = {
  points: string;
  fill: string;
  sort: number;
  kind: "floor" | "wall" | "furn";
};

export type SceneLine = { points: string; stroke: string; width: number };
export type SceneDot = { cx: number; cy: number; r: number; fill: string };

export type Scene = {
  polys: Poly[];
  lines: SceneLine[];
  dots: SceneDot[];
};

export function iso(x: number, y: number) {
  return { sx: (x - y) * HW, sy: (x + y) * HH };
}

const minSx = (0 - MAP_MAX) * HW;
const maxSx = (MAP_MAX - 0) * HW;
const maxSy = (MAP_MAX + MAP_MAX) * HH;

export const ORIGIN = { x: PAD_X - minSx, y: PAD_TOP };
export const WORLD_W = maxSx - minSx + PAD_X * 2;
export const WORLD_H = maxSy + PAD_TOP + PAD_BOTTOM;
export const BRAIN: Point = { x: 8, y: 8 };

export function project(x: number, y: number) {
  const point = iso(x, y);
  return { sx: point.sx + ORIGIN.x, sy: point.sy + ORIGIN.y };
}

const ROOM_FILL: Record<Exclude<RoomId, "visitor">, [string, string]> = {
  psych: ["#ddd0fb", "#d0bef6"],
  ethnic: ["#f8d2b0", "#f3c49a"],
  gov: ["#c9d6ee", "#b7c8e6"],
  pe: ["#f0d2a0", "#e6c48c"],
  atrium: ["#2c2860", "#262252"],
};

const RUG: Partial<Record<RoomId, { x0: number; x1: number; y0: number; y1: number; a: string; b: string }>> = {
  psych: { x0: 6, x1: 10, y0: 1, y1: 4, a: "#c4b5fd", b: "#b79aef" },
  ethnic: { x0: 1, x1: 4, y0: 6, y1: 10, a: "#fdba74", b: "#fb923c" },
  gov: { x0: 12, x1: 15, y0: 6, y1: 10, a: "#93c5fd", b: "#7dd3fc" },
};

const WALL: Record<RoomId, [string, string]> = {
  psych: ["#7c3aed", "#5b21b6"],
  ethnic: ["#ea580c", "#c2410c"],
  gov: ["#1d4ed8", "#1e3a8a"],
  pe: ["#16a34a", "#166534"],
  atrium: ["#4338ca", "#312e81"],
  visitor: ["#a8a29e", "#78716c"],
};

export const HOMES: Record<string, Home> = {
  "ms-boone": {
    desk: { x: 7.8, y: 2.55 },
    wander: [
      { x: 6.3, y: 2.1 },
      { x: 9.2, y: 2.4 },
      { x: 8.6, y: 3.55 },
      { x: 6.5, y: 3.5 },
    ],
    toBrain: [
      { x: 8, y: 4.65 },
      { x: 10.15, y: 6.7 },
      { x: 10.15, y: 9.35 },
      { x: 8.35, y: 9.7 },
    ],
  },
  "ms-bhon": {
    desk: { x: 2.55, y: 7.7 },
    wander: [
      { x: 2.2, y: 6.3 },
      { x: 3.5, y: 7.2 },
      { x: 2.3, y: 9.2 },
      { x: 3.6, y: 9.1 },
    ],
    toBrain: [
      { x: 4.65, y: 8 },
      { x: 6.15, y: 10.15 },
      { x: 7.55, y: 9.85 },
    ],
  },
  "mr-prendagas": {
    desk: { x: 13.15, y: 7.7 },
    wander: [
      { x: 12.3, y: 6.4 },
      { x: 13.6, y: 8.6 },
      { x: 14.4, y: 9.2 },
      { x: 12.4, y: 9.1 },
    ],
    toBrain: [
      { x: 11.35, y: 8 },
      { x: 10.45, y: 10.05 },
      { x: 9.25, y: 9.65 },
    ],
  },
  "coach-bates": {
    desk: { x: 7.7, y: 13.15 },
    wander: [
      { x: 6.3, y: 12.35 },
      { x: 9.1, y: 12.5 },
      { x: 9.2, y: 14.3 },
      { x: 6.4, y: 14.2 },
    ],
    toBrain: [
      { x: 8, y: 11.35 },
      { x: 8.7, y: 10.35 },
    ],
  },
};

const PADS: Array<{ tiles: Point[]; home: Home }> = [
  {
    tiles: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
    ],
    home: {
      desk: { x: 2.2, y: 2.1 },
      wander: [
        { x: 1.6, y: 1.6 },
        { x: 3.1, y: 2.4 },
      ],
      toBrain: [
        { x: 4.4, y: 4.4 },
        { x: 6.3, y: 6.5 },
        { x: 8.3, y: 9.55 },
      ],
    },
  },
  {
    tiles: [
      { x: 12, y: 1 },
      { x: 13, y: 1 },
      { x: 14, y: 1 },
      { x: 12, y: 2 },
      { x: 13, y: 2 },
      { x: 14, y: 2 },
      { x: 12, y: 3 },
      { x: 13, y: 3 },
      { x: 14, y: 3 },
      { x: 12, y: 4 },
      { x: 11, y: 4 },
    ],
    home: {
      desk: { x: 13.2, y: 2.1 },
      wander: [
        { x: 12.4, y: 1.6 },
        { x: 14.1, y: 2.6 },
      ],
      toBrain: [
        { x: 11.2, y: 4.4 },
        { x: 9.7, y: 6.4 },
        { x: 9.2, y: 9.5 },
      ],
    },
  },
  {
    tiles: [
      { x: 1, y: 12 },
      { x: 2, y: 12 },
      { x: 3, y: 12 },
      { x: 1, y: 13 },
      { x: 2, y: 13 },
      { x: 3, y: 13 },
      { x: 1, y: 14 },
      { x: 2, y: 14 },
      { x: 3, y: 14 },
      { x: 4, y: 12 },
      { x: 4, y: 11 },
    ],
    home: {
      desk: { x: 2.2, y: 13.2 },
      wander: [
        { x: 1.6, y: 12.6 },
        { x: 3.1, y: 13.6 },
      ],
      toBrain: [
        { x: 4.4, y: 11.3 },
        { x: 6.4, y: 10.2 },
        { x: 7.6, y: 9.85 },
      ],
    },
  },
  {
    tiles: [
      { x: 12, y: 12 },
      { x: 13, y: 12 },
      { x: 14, y: 12 },
      { x: 12, y: 13 },
      { x: 13, y: 13 },
      { x: 14, y: 13 },
      { x: 12, y: 14 },
      { x: 13, y: 14 },
      { x: 14, y: 14 },
      { x: 11, y: 12 },
      { x: 11, y: 11 },
    ],
    home: {
      desk: { x: 13.2, y: 13.2 },
      wander: [
        { x: 12.4, y: 12.6 },
        { x: 14.1, y: 13.5 },
      ],
      toBrain: [
        { x: 11.2, y: 11.2 },
        { x: 10.15, y: 10.15 },
        { x: 9.15, y: 9.6 },
      ],
    },
  },
];

const OVERFLOW: Point[] = [
  { x: 6.25, y: 6.25 },
  { x: 9.7, y: 6.3 },
  { x: 6.3, y: 6.9 },
  { x: 9.65, y: 6.85 },
];

export function homeForVisitor(index: number): Home {
  if (index >= 0 && index < PADS.length) return PADS[index].home;
  const spot = OVERFLOW[(index - PADS.length) % OVERFLOW.length];
  return {
    desk: spot,
    wander: [spot, { x: spot.x + 0.35, y: spot.y + 0.25 }],
    toBrain: [{ x: 8.5, y: 9.7 }],
  };
}

export const ROOM_SIGNS: Array<{ title: string; who: string; at: Point; tone: string }> = [
  { title: "Psychology", who: "Ms Boone", at: { x: 5.35, y: 0.05 }, tone: "#6d28d9" },
  { title: "Ethnic Studies", who: "Ms Bhon", at: { x: 0.05, y: 5.35 }, tone: "#c2410c" },
  { title: "History & Gov", who: "Mr Prendagas", at: { x: 15.15, y: 5.15 }, tone: "#1e3a8a" },
  { title: "P.E.", who: "Coach Bates", at: { x: 10.15, y: 15.15 }, tone: "#166534" },
];

function addRect(tiles: Tile[], room: RoomId, x0: number, x1: number, y0: number, y1: number) {
  for (let x = x0; x < x1; x += 1) {
    for (let y = y0; y < y1; y += 1) tiles.push({ x, y, room });
  }
}

function pointsOf(coords: Array<{ sx: number; sy: number }>) {
  return coords.map((point) => `${point.sx.toFixed(1)},${point.sy.toFixed(1)}`).join(" ");
}

function tileFill(tile: Tile): string {
  if (tile.room === "visitor") {
    const hue = tile.hue ?? 30;
    const alt = (tile.x + tile.y) % 2 === 0;
    return `hsl(${hue} 46% ${alt ? 78 : 72}%)`;
  }
  const rug = RUG[tile.room];
  if (
    rug &&
    tile.x >= rug.x0 &&
    tile.x < rug.x1 &&
    tile.y >= rug.y0 &&
    tile.y < rug.y1
  ) {
    return (tile.x + tile.y) % 2 === 0 ? rug.a : rug.b;
  }
  if (tile.room === "atrium") {
    const onPath = tile.x === 7 || tile.x === 8 || tile.y === 7 || tile.y === 8;
    return onPath ? "#3a3578" : (tile.x + tile.y) % 2 === 0 ? "#2c2860" : "#262252";
  }
  const pair = ROOM_FILL[tile.room];
  return (tile.x + tile.y) % 2 === 0 ? pair[0] : pair[1];
}

function wallColor(room: RoomId, hue: number | undefined, alongX: boolean) {
  if (room === "visitor") {
    return `hsl(${hue ?? 30} 38% ${alongX ? 42 : 34}%)`;
  }
  const pair = WALL[room];
  return alongX ? pair[0] : pair[1];
}

type Box = {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
};

const FURNITURE: Box[] = [
  { x: 6.35, y: 0.35, w: 1.55, d: 0.72, h: 26, top: "#d6b48a", left: "#a67c52", right: "#8b6240" },
  { x: 8.5, y: 3.15, w: 1.7, d: 0.65, h: 16, top: "#ddd6fe", left: "#a78bfa", right: "#8b5cf6" },
  { x: 5.35, y: 0.4, w: 0.38, d: 0.38, h: 40, top: "#fde68a", left: "#fbbf24", right: "#d97706" },
  { x: 0.28, y: 6.25, w: 0.72, d: 1.45, h: 26, top: "#e7cba3", left: "#b45309", right: "#9a3412" },
  { x: 0.28, y: 8.35, w: 0.58, d: 1.55, h: 48, top: "#fdba74", left: "#9a3412", right: "#7c2d12" },
  { x: 14.15, y: 6.2, w: 1.25, d: 0.78, h: 26, top: "#d6b48a", left: "#1e3a8a", right: "#172554" },
  { x: 14.55, y: 8.35, w: 0.7, d: 1.6, h: 50, top: "#93c5fd", left: "#1e3a8a", right: "#172554" },
  { x: 12.45, y: 9.15, w: 0.7, d: 0.7, h: 32, top: "#7f1d1d", left: "#991b1b", right: "#7f1d1d" },
  { x: 5.9, y: 14.25, w: 1.9, d: 0.55, h: 16, top: "#bbf7d0", left: "#166534", right: "#14532d" },
  { x: 8.15, y: 12.55, w: 1.45, d: 1.35, h: 4, top: "#4ade80", left: "#166534", right: "#15803d" },
  { x: 5.45, y: 12.15, w: 0.38, d: 0.38, h: 22, top: "#fb923c", left: "#ea580c", right: "#c2410c" },
  { x: 9.7, y: 14.55, w: 0.38, d: 0.38, h: 22, top: "#fb923c", left: "#ea580c", right: "#c2410c" },
  { x: 7.32, y: 7.32, w: 1.36, d: 1.36, h: 18, top: "#312e81", left: "#1e1b4b", right: "#0f172a" },
];

function boxPolys(box: Box): Poly[] {
  const a = project(box.x, box.y);
  const b = project(box.x + box.w, box.y);
  const c = project(box.x + box.w, box.y + box.d);
  const d = project(box.x, box.y + box.d);
  const up = (point: { sx: number; sy: number }) => ({ sx: point.sx, sy: point.sy - box.h });
  const depth = box.x + box.w + box.y + box.d;
  return [
    { points: pointsOf([d, c, up(c), up(d)]), fill: box.left, sort: depth - 0.02, kind: "furn" },
    { points: pointsOf([b, c, up(c), up(b)]), fill: box.right, sort: depth - 0.01, kind: "furn" },
    { points: pointsOf([up(a), up(b), up(c), up(d)]), fill: box.top, sort: depth, kind: "furn" },
  ];
}

export function buildScene(visitorHues: number[]): Scene {
  const tiles: Tile[] = [];
  addRect(tiles, "psych", 5, 11, 0, 5);
  addRect(tiles, "ethnic", 0, 5, 5, 11);
  addRect(tiles, "atrium", 5, 11, 5, 11);
  addRect(tiles, "gov", 11, 16, 5, 11);
  addRect(tiles, "pe", 5, 11, 11, 16);

  visitorHues.slice(0, PADS.length).forEach((hue, index) => {
    for (const tile of PADS[index].tiles) {
      tiles.push({ x: tile.x, y: tile.y, room: "visitor", hue });
    }
  });

  const occupied = new Set(tiles.map((tile) => `${tile.x},${tile.y}`));
  const polys: Poly[] = [];

  for (const tile of tiles) {
    const a = project(tile.x, tile.y);
    const b = project(tile.x + 1, tile.y);
    const c = project(tile.x + 1, tile.y + 1);
    const d = project(tile.x, tile.y + 1);
    polys.push({
      points: pointsOf([a, b, c, d]),
      fill: tileFill(tile),
      sort: tile.x + tile.y + 2,
      kind: "floor",
    });

    const edges = [
      { nx: 0, ny: -1, x1: tile.x, y1: tile.y, x2: tile.x + 1, y2: tile.y },
      { nx: 1, ny: 0, x1: tile.x + 1, y1: tile.y, x2: tile.x + 1, y2: tile.y + 1 },
      { nx: 0, ny: 1, x1: tile.x, y1: tile.y + 1, x2: tile.x + 1, y2: tile.y + 1 },
      { nx: -1, ny: 0, x1: tile.x, y1: tile.y, x2: tile.x, y2: tile.y + 1 },
    ];
    for (const edge of edges) {
      if (occupied.has(`${tile.x + edge.nx},${tile.y + edge.ny}`)) continue;
      const start = project(edge.x1, edge.y1);
      const end = project(edge.x2, edge.y2);
      const height = tile.room === "atrium" ? 28 : 50;
      const alongX = edge.y1 === edge.y2;
      polys.push({
        points: pointsOf([
          start,
          end,
          { sx: end.sx, sy: end.sy - height },
          { sx: start.sx, sy: start.sy - height },
        ]),
        fill: wallColor(tile.room, tile.hue, alongX),
        sort: Math.max(edge.x1 + edge.y1, edge.x2 + edge.y2) + 0.35,
        kind: "wall",
      });
    }
  }

  for (const box of FURNITURE) polys.push(...boxPolys(box));
  polys.sort((a, b) => a.sort - b.sort);

  const rectLine = (x0: number, y0: number, x1: number, y1: number) => {
    const a = project(x0, y0);
    const b = project(x1, y0);
    const c = project(x1, y1);
    const d = project(x0, y1);
    return pointsOf([a, b, c, d, a]);
  };

  const lines: SceneLine[] = [
    { points: rectLine(5.35, 11.35, 10.65, 15.65), stroke: "rgba(255,255,255,0.8)", width: 2 },
    {
      points: pointsOf([project(8, 11.35), project(8, 15.65)]),
      stroke: "rgba(255,255,255,0.75)",
      width: 2,
    },
    { points: rectLine(6.3, 14.15, 9.7, 15.65), stroke: "#fb923c", width: 2.5 },
  ];

  const ball = project(8.2, 12.45);
  const dots: SceneDot[] = [{ cx: ball.sx, cy: ball.sy - 12, r: 8, fill: "#f97316" }];

  return { polys, lines, dots };
}
