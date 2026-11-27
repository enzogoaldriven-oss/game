export function BigBrain({ pulse }: { pulse: number }) {
  return (
    <div className="pointer-events-none relative h-[230px] w-[210px] -translate-x-1/2 -translate-y-[92%]">
      <div className="brain-glow" />
      <svg viewBox="0 0 210 230" className="brain-svg relative h-full w-full overflow-visible">
        <defs>
          <radialGradient id="brain-glass" cx="34%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f0fdff" />
            <stop offset="22%" stopColor="#67e8f9" />
            <stop offset="58%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
          <filter id="brain-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="105" cy="206" rx="70" ry="14" fill="rgba(0,0,0,0.35)" />
        <ellipse cx="105" cy="198" rx="54" ry="12" fill="#1e1b4b" />
        <ellipse cx="105" cy="194" rx="40" ry="8" fill="#6366f1" />
        <g filter="url(#brain-soft)">
          <circle className="brain-sphere" cx="105" cy="104" r="74" fill="url(#brain-glass)" />
          <path
            className="neural"
            d="M78 108 C70 78 92 62 108 74 C124 60 146 78 140 108 C150 128 132 150 112 146 C90 156 66 132 78 108"
            fill="none"
            stroke="#f0abfc"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M105 70 C103 110 108 130 105 150" fill="none" stroke="#f0abfc" strokeWidth="2.2" opacity="0.85" />
          <path className="neural neural-b" d="M84 96 H128 M80 116 H132 M92 132 H120" fill="none" stroke="#a5f3fc" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="82" cy="78" rx="20" ry="10" fill="white" opacity="0.38" />
        </g>
      </svg>
      <div className="orbit" aria-hidden>
        <span />
        <span />
      </div>
      <div key={pulse} className="brain-ring" />
      <div className="brain-mark font-display">BIG BRAIN</div>
    </div>
  );
}
