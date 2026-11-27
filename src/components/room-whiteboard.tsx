"use client";

import type { ClassInfo } from "@/lib/classes";
import { project, type WhiteboardSpec } from "@/lib/iso";
import type { GradeTodo } from "@/lib/types";

const BOARD_H = 34;

export function FloorWhiteboard({
  spec,
  subject,
  todos,
  onOpen,
}: {
  spec: WhiteboardSpec;
  subject: ClassInfo;
  todos: GradeTodo[];
  onOpen: () => void;
}) {
  const open = todos.filter((todo) => todo.status === "todo");
  const anchor = spec.axis === "x" ? project(spec.x, spec.y) : project(spec.x, spec.y + spec.w);
  const far = spec.axis === "x" ? project(spec.x + spec.w, spec.y) : project(spec.x, spec.y);
  const width = Math.abs(far.sx - anchor.sx);
  const skew = spec.axis === "x" ? "skewY(26.565deg)" : "skewY(-26.565deg)";
  const shown = open.slice(0, 2);

  return (
    <button
      type="button"
      className="room-board"
      data-ink={spec.classId}
      style={{
        left: anchor.sx,
        top: anchor.sy - BOARD_H - 10,
        width,
        height: BOARD_H,
        transform: skew,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onOpen}
      aria-label={`${subject.name} whiteboard, ${open.length} open. Zoom in.`}
    >
      <span className="room-board-face">
        <span className="room-board-head">
          <span>{subject.name}</span>
          <span className="room-board-count">{open.length}</span>
        </span>
        {shown.length === 0 ? (
          <span className="room-board-empty">Nothing up yet</span>
        ) : (
          <span className="room-board-list">
            {shown.map((todo) => (
              <span key={todo.id} className="room-board-item">
                <i aria-hidden />
                <span>{todo.title}</span>
              </span>
            ))}
            {open.length > shown.length ? <span className="room-board-more">+{open.length - shown.length} more</span> : null}
          </span>
        )}
      </span>
    </button>
  );
}
