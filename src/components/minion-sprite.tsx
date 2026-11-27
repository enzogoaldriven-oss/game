import { cn } from "@/lib/utils";
import type { Variant } from "@/lib/bots";

function Eyes({ goggles = true }: { goggles?: boolean }) {
  return (
    <g className="eyes">
      {goggles ? (
        <path d="M62 96 H138" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
      ) : null}
      <circle cx="84" cy="90" r="14" fill="#fffdf8" stroke="#1c1917" strokeWidth={goggles ? 4 : 3} />
      <circle cx="116" cy="90" r="14" fill="#fffdf8" stroke="#1c1917" strokeWidth={goggles ? 4 : 3} />
      <circle cx="84" cy="91" r="6.5" fill="#1c1917" />
      <circle cx="116" cy="91" r="6.5" fill="#1c1917" />
      <circle cx="86.5" cy="88" r="2.4" fill="#fff" />
      <circle cx="118.5" cy="88" r="2.4" fill="#fff" />
    </g>
  );
}

function Glasses() {
  return (
    <g className="eyes">
      <circle cx="84" cy="90" r="15" fill="#fffdf8" />
      <circle cx="116" cy="90" r="15" fill="#fffdf8" />
      <circle cx="84" cy="91" r="6.2" fill="#312e81" />
      <circle cx="116" cy="91" r="6.2" fill="#312e81" />
      <circle cx="86.5" cy="88" r="2.3" fill="#fff" />
      <circle cx="118.5" cy="88" r="2.3" fill="#fff" />
      <circle cx="84" cy="90" r="15" fill="none" stroke="#1e1b4b" strokeWidth="3.5" />
      <circle cx="116" cy="90" r="15" fill="none" stroke="#1e1b4b" strokeWidth="3.5" />
      <path d="M99 90 H101" stroke="#1e1b4b" strokeWidth="3.5" />
      <path d="M69 88 H70 M131 88 H132" stroke="#1e1b4b" strokeWidth="3" />
    </g>
  );
}

function Smile({ color = "#7c2d12" }: { color?: string }) {
  return (
    <path d="M86 110 Q100 122 114 110" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
  );
}

function Legs({ shoe, stripe = false }: { shoe: string; stripe?: boolean }) {
  return (
    <>
      <g className="leg leg-a">
        <rect x="76" y="162" width="16" height="24" rx="7" fill={shoe} />
        {stripe ? <rect x="80" y="166" width="4" height="14" rx="2" fill="#fff" /> : null}
      </g>
      <g className="leg leg-b">
        <rect x="108" y="162" width="16" height="24" rx="7" fill={shoe} />
        {stripe ? <rect x="116" y="166" width="4" height="14" rx="2" fill="#fff" /> : null}
      </g>
    </>
  );
}

function Prendagas() {
  return (
    <>
      <path d="M74 62 Q100 40 128 64 Q108 52 74 62" fill="#0f172a" />
      <rect x="66" y="58" width="68" height="108" rx="34" fill="#243e86" />
      <Legs shoe="#0f172a" />
      <path d="M68 118 L86 118 L100 154 L114 118 L132 118 L140 166 Q100 180 60 166 Z" fill="#172554" />
      <path d="M90 116 L100 148 L110 116 Z" fill="#f8fafc" />
      <path d="M96 120 L100 156 L104 120 Z" fill="#e11d48" />
      <circle cx="100" cy="160" r="3.2" fill="#fbbf24" />
      <path d="M78 118 L100 146" fill="none" stroke="#93c5fd" strokeWidth="2" />
      <path d="M122 118 L100 146" fill="none" stroke="#93c5fd" strokeWidth="2" />
      <g className="arm arm-l">
        <rect x="48" y="112" width="18" height="34" rx="9" fill="#172554" />
        <circle cx="57" cy="148" r="9" fill="#f6d56b" />
        <g transform="translate(18 118)">
          <rect x="0" y="4" width="30" height="38" rx="4" fill="#f4e4c4" stroke="#d6c4a3" strokeWidth="1.5" />
          <path d="M6 14 h18 M6 20 h18 M6 26 h14" stroke="#a8a29e" strokeWidth="1.4" />
          <path d="M0 8 Q-8 22 2 36" fill="none" stroke="#1d4ed8" strokeWidth="3" />
          <circle cx="15" cy="34" r="5" fill="#dc2626" />
        </g>
      </g>
      <g className="arm arm-r">
        <rect x="134" y="112" width="18" height="34" rx="9" fill="#172554" />
        <circle cx="143" cy="148" r="9" fill="#f6d56b" />
        <g transform="translate(150 124) rotate(-28)">
          <rect x="0" y="7" width="32" height="7" rx="3" fill="#92400e" />
          <rect x="24" y="-2" width="14" height="24" rx="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1.4" />
        </g>
      </g>
      <ellipse cx="74" cy="106" rx="7" ry="3.4" fill="#fb7185" opacity="0.35" />
      <ellipse cx="126" cy="106" rx="7" ry="3.4" fill="#fb7185" opacity="0.35" />
      <Eyes />
      <Smile color="#fecdd3" />
    </>
  );
}

function Bates() {
  return (
    <>
      <path d="M64 86 Q100 28 136 86 Q124 108 100 100 Q76 108 64 86" fill="#15803d" />
      <rect x="66" y="70" width="68" height="98" rx="32" fill="#22c55e" />
      <ellipse cx="100" cy="92" rx="30" ry="28" fill="#ffe566" />
      <rect x="70" y="66" width="60" height="12" rx="6" fill="#ecfccb" />
      <Legs shoe="#f8fafc" stripe />
      <rect x="74" y="124" width="7" height="40" rx="2" fill="#fff" />
      <rect x="119" y="124" width="7" height="40" rx="2" fill="#fff" />
      <path d="M100 114 V160" stroke="#052e16" strokeWidth="2.4" />
      <circle cx="100" cy="128" r="2" fill="#e2e8f0" />
      <path d="M86 116 Q100 128 112 124" fill="none" stroke="#0f172a" strokeWidth="1.6" />
      <circle cx="112" cy="124" r="6.5" fill="#f8fafc" stroke="#334155" strokeWidth="1.6" />
      <rect x="109" y="118" width="6" height="4" rx="1" fill="#334155" />
      <g className="arm arm-l">
        <rect x="46" y="116" width="16" height="32" rx="8" fill="#16a34a" />
        <rect x="48" y="120" width="4" height="24" fill="#fff" />
        <circle cx="54" cy="150" r="8" fill="#ffe566" />
        <g transform="translate(16 126)">
          <circle cx="16" cy="18" r="15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.4" />
          <rect x="12" y="0" width="8" height="7" rx="2" fill="#0f172a" />
          <path d="M16 18 V8" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 18 L23 21" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      <g className="arm arm-r">
        <rect x="138" y="116" width="16" height="32" rx="8" fill="#16a34a" />
        <rect x="148" y="120" width="4" height="24" fill="#fff" />
        <circle cx="146" cy="150" r="8" fill="#ffe566" />
        <g transform="translate(154 136)">
          <rect x="10" y="6" width="24" height="7" rx="3" fill="#44403c" />
          <rect x="0" y="-1" width="12" height="20" rx="4" fill="#166534" />
          <rect x="32" y="-1" width="12" height="20" rx="4" fill="#166534" />
        </g>
      </g>
      <Eyes />
      <Smile />
    </>
  );
}

function Bhon() {
  return (
    <>
      <path d="M58 118 L96 46 L118 86 L132 38 L168 118 Z" fill="#57534e" />
      <path d="M86 118 L104 70 L122 118 Z" fill="#65a30d" />
      <path d="M120 64 L132 38 L146 78 Z" fill="#e7e5e4" />
      <path d="M54 112 L150 112 L158 168 L46 168 Z" fill="#78716c" />
      <path d="M118 58 Q156 78 146 124 Q130 96 126 74" fill="#3f2a1d" />
      <rect x="66" y="58" width="68" height="108" rx="34" fill="#fb923c" />
      <ellipse cx="100" cy="90" rx="30" ry="26" fill="#fdba74" />
      <Legs shoe="#7c2d12" />
      <path d="M62 116 L84 116 L100 150 L116 116 L138 116 L144 168 Q100 182 56 168 Z" fill="#3b82c4" />
      <path d="M90 120 L100 156 L110 120 Z" fill="#fb923c" />
      <rect x="70" y="138" width="16" height="12" rx="2" fill="#1e3a8a" />
      <rect x="114" y="138" width="16" height="12" rx="2" fill="#1e3a8a" />
      <path d="M84 112 Q88 140 92 156" fill="none" stroke="#44403c" strokeWidth="4" />
      <path d="M116 112 Q112 140 108 156" fill="none" stroke="#44403c" strokeWidth="4" />
      <g className="arm arm-l">
        <rect x="46" y="114" width="16" height="32" rx="8" fill="#2563eb" />
        <circle cx="54" cy="148" r="8" fill="#fdba74" />
        <g transform="translate(8 132)">
          <rect x="8" y="4" width="36" height="16" rx="4" fill="#fef3c7" stroke="#d6d3d1" />
          <circle cx="8" cy="12" r="9" fill="#fde68a" stroke="#d6d3d1" />
          <circle cx="44" cy="12" r="9" fill="#fde68a" stroke="#d6d3d1" />
          <path d="M16 12 h5 M24 12 h5 M32 12 h5" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
      <g className="arm arm-r">
        <rect x="138" y="114" width="16" height="32" rx="8" fill="#2563eb" />
        <circle cx="146" cy="148" r="8" fill="#fdba74" />
      </g>
      <Eyes />
      <Smile />
    </>
  );
}

function Boone() {
  return (
    <>
      <circle cx="100" cy="46" r="16" fill="#5b21b6" />
      <circle cx="108" cy="40" r="6" fill="#ddd6fe" />
      <rect x="66" y="58" width="68" height="108" rx="34" fill="#7c3aed" />
      <ellipse cx="100" cy="92" rx="30" ry="26" fill="#ddd6fe" />
      <Legs shoe="#4c1d95" />
      <path d="M60 118 L82 118 L100 156 L118 118 L140 118 L146 172 Q100 186 54 172 Z" fill="#ddd6fe" />
      <path d="M88 122 L100 162 L112 122 Z" fill="#7c3aed" />
      <circle cx="84" cy="136" r="2.6" fill="#6d28d9" />
      <circle cx="82" cy="150" r="2.6" fill="#6d28d9" />
      <circle cx="116" cy="136" r="2.6" fill="#6d28d9" />
      <circle cx="118" cy="150" r="2.6" fill="#6d28d9" />
      <g className="arm arm-l">
        <rect x="46" y="116" width="16" height="32" rx="8" fill="#c4b5fd" />
        <circle cx="54" cy="150" r="8" fill="#ddd6fe" />
        <g transform="translate(12 112)">
          <path d="M10 28 Q2 14 14 8 Q20 0 26 10 Q38 6 36 20 Q42 28 32 34 Q24 42 18 34 Q8 38 10 28" fill="#f9a8d4" stroke="#be185d" strokeWidth="1.4" />
          <path d="M22 8 V30" fill="none" stroke="#be185d" strokeWidth="1.3" />
        </g>
      </g>
      <g className="arm arm-r">
        <rect x="138" y="116" width="16" height="32" rx="8" fill="#c4b5fd" />
        <circle cx="146" cy="150" r="8" fill="#ddd6fe" />
        <g transform="translate(150 118)">
          <rect x="0" y="8" width="28" height="36" rx="3" fill="#fff" stroke="#e7e5e4" />
          <rect x="8" y="2" width="12" height="9" rx="2" fill="#6d28d9" />
          <path d="M5 18 h18 M5 24 h18 M5 30 h12" stroke="#c4b5fd" strokeWidth="1.6" />
          <path d="M5 36 l3 3 l5 -6" fill="none" stroke="#16a34a" strokeWidth="1.8" />
        </g>
      </g>
      <Glasses />
      <Smile color="#6d28d9" />
    </>
  );
}

function Generic({ hue, badge }: { hue: number; badge?: string }) {
  const overall = `hsl(${hue} 72% 46%)`;
  return (
    <>
      <line x1="100" y1="48" x2="100" y2="26" stroke="#44403c" strokeWidth="3" />
      <circle cx="100" cy="22" r="8" fill={overall} />
      <rect x="66" y="58" width="68" height="108" rx="34" fill="#ffe14a" />
      <Legs shoe="#1c1917" />
      <path d="M70 124 h60 v40 q-30 16 -60 0 Z" fill={overall} />
      <rect x="84" y="112" width="7" height="16" fill={overall} />
      <rect x="109" y="112" width="7" height="16" fill={overall} />
      <circle cx="100" cy="142" r="8" fill="#fef3c7" />
      {badge ? (
        <text x="100" y="146" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Nunito, sans-serif" fill="#1c1917">
          {badge.slice(0, 1).toUpperCase()}
        </text>
      ) : null}
      <g className="arm arm-l">
        <rect x="48" y="116" width="16" height="30" rx="8" fill="#ffe14a" />
        <circle cx="56" cy="148" r="8" fill="#1d4ed8" />
      </g>
      <g className="arm arm-r">
        <rect x="136" y="116" width="16" height="30" rx="8" fill="#ffe14a" />
        <circle cx="144" cy="148" r="8" fill="#1d4ed8" />
      </g>
      <Eyes />
      <Smile />
    </>
  );
}

export function MinionSprite({
  variant,
  hue = 200,
  badge,
  className,
}: {
  variant: Variant;
  hue?: number;
  badge?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 210" className={cn("minion-svg h-[132px] w-[126px] overflow-visible", `blink-${variant}`, className)} aria-hidden>
      <ellipse className="shadow" cx="100" cy="196" rx="34" ry="8" fill="rgba(0,0,0,0.28)" />
      {variant === "prendagas" ? <Prendagas /> : null}
      {variant === "bates" ? <Bates /> : null}
      {variant === "bhon" ? <Bhon /> : null}
      {variant === "boone" ? <Boone /> : null}
      {variant === "generic" ? <Generic hue={hue} badge={badge} /> : null}
    </svg>
  );
}

export function BotMedallion({
  variant,
  hue = 200,
  className,
}: {
  variant: Variant;
  hue?: number;
  className?: string;
}) {
  const fill =
    variant === "boone"
      ? "#7c3aed"
      : variant === "bhon"
        ? "#fb923c"
        : variant === "prendagas"
          ? "#1d4ed8"
          : variant === "bates"
            ? "#16a34a"
            : `hsl(${hue} 70% 48%)`;
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-inner", className)} style={{ background: fill }}>
      <span className="flex gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-white shadow" />
        <i className="h-2.5 w-2.5 rounded-full bg-white shadow" />
      </span>
    </span>
  );
}
