"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatPercent, letterTone, type ClassGrade } from "@/lib/grade-format";
import { project, type WhiteboardSpec } from "@/lib/iso";
import { cn } from "@/lib/utils";

const BOARD_H = 34;

function formatAsOf(asOf: string) {
  const [year, month, day] = asOf.split("-").map(Number);
  if (!year || !month || !day) return asOf;
  return new Date(year, month - 1, day).toLocaleDateString([], { month: "short", day: "numeric" });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function CountUp({ value }: { value: number }) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef(0);

  useEffect(() => {
    const start = from.current;
    const end = value;
    if (start === end || reduced) {
      from.current = end;
      return;
    }
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 700);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round((start + (end - start) * eased) * 10) / 10);
      if (progress < 1) frame.current = window.requestAnimationFrame(step);
      else from.current = end;
    };
    frame.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame.current);
  }, [reduced, value]);

  return <>{formatPercent(reduced ? value : shown)}</>;
}

export function GradePlaque({
  spec,
  grade,
  updating,
}: {
  spec: WhiteboardSpec;
  grade: ClassGrade | null;
  updating: boolean;
}) {
  const anchor = spec.axis === "x" ? project(spec.x, spec.y) : project(spec.x, spec.y + spec.w);
  const far = spec.axis === "x" ? project(spec.x + spec.w, spec.y) : project(spec.x, spec.y);
  const boardLeft = Math.min(anchor.sx, far.sx);
  const boardTop = anchor.sy - BOARD_H - 10;
  const tone = grade ? letterTone(grade.letter) : "f";
  const percent = grade?.percent ?? 0;
  const previous = grade?.previousPercent;
  const direction = previous == null || previous === percent ? null : percent > previous ? "up" : "down";
  const ring = 2 * Math.PI * 15;
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * ring;

  return (
    <div
      className={cn("grade-plaque", `grade-${tone}`, updating && "is-updating", direction && "is-changed")}
      style={{ left: boardLeft, top: boardTop - 62 }}
      aria-hidden={grade === null}
    >
      {grade ? (
        <>
          <svg className="grade-ring" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r="15" />
            <circle cx="20" cy="20" r="15" strokeDasharray={`${dash} ${ring}`} />
          </svg>
          <div className="min-w-0">
            <p className="grade-letter">
              <span key={`${grade.letter}-${grade.percent}`} className="grade-pop">
                {grade.letter}
              </span>
              {direction ? <span className={cn("grade-arrow", direction === "up" ? "is-up" : "is-down")}>{direction === "up" ? "↑" : "↓"}</span> : null}
            </p>
            <p className="grade-percent">
              <CountUp value={grade.percent} />%
            </p>
            <p className="grade-asof">as of {formatAsOf(grade.asOf)}</p>
          </div>
          {updating ? <p className="grade-updating">Updating grades…</p> : null}
        </>
      ) : updating ? (
        <p className="grade-updating">Updating grades…</p>
      ) : null}
    </div>
  );
}
