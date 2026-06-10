"use client";

import { useRef, useState } from "react";

export interface ShiftBlock {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  color?: string | null;
}

interface ShiftTimelineProps {
  shifts: ShiftBlock[];
  onShiftClick?: (shift: ShiftBlock) => void;
  onShiftUpdate?: (id: string, startHour: number, endHour: number) => void;
  readonly?: boolean;
}

export const DEFAULT_SHIFT_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336", "#00BCD4", "#795548"];

const HOUR_MARKERS = [0, 4, 8, 12, 16, 20, 24];

function hourToPercent(h: number) {
  return (h / 24) * 100;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function fmt(h: number) {
  return `${String(h === 24 ? 0 : h).padStart(2, "0")}:00`;
}

export function ShiftTimeline({ shifts, onShiftClick, onShiftUpdate, readonly }: ShiftTimelineProps) {
  const trackRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragPreviews, setDragPreviews] = useState<Map<string, { startHour: number; endHour: number }>>(new Map());

  function startDrag(e: React.MouseEvent, shift: ShiftBlock, type: "start" | "end" | "move") {
    if (readonly) return;
    
    e.stopPropagation();
    e.preventDefault();

    const startClientX = e.clientX;
    const trackEl = trackRefs.current.get(shift.id);
    let preview = { startHour: shift.startHour, endHour: shift.endHour };

    setDragPreviews((prev) => new Map(prev).set(shift.id, { ...preview }));

    function onMove(ev: MouseEvent) {
      if (!trackEl) return;
      const rect = trackEl.getBoundingClientRect();
      const delta = Math.round(((ev.clientX - startClientX) / rect.width) * 24);
      let s = shift.startHour;
      let end = shift.endHour;
      const duration = shift.endHour - shift.startHour;

      if (type === "start") {
        s = clamp(shift.startHour + delta, 0, shift.endHour - 1);
        end = shift.endHour;
      } else if (type === "end") {
        // endHour can be 24 (midnight)
        end = clamp(shift.endHour + delta, s + 1, 24);
      } else {
        s = clamp(shift.startHour + delta, 0, 24 - duration);
        end = s + duration;
      }

      preview = { startHour: s, endHour: end };
      setDragPreviews((prev) => new Map(prev).set(shift.id, { ...preview }));
    }

    function onUp() {
      onShiftUpdate?.(shift.id, preview.startHour, preview.endHour);
      setDragPreviews((prev) => {
        const next = new Map(prev);
        next.delete(shift.id);
        return next;
      });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (shifts.length === 0) return null;

  return (
    <div className="select-none space-y-3">
      {/* Hour markers header */}
      <div className="relative h-5 ml-28">
        {HOUR_MARKERS.map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-text-muted -translate-x-1/2"
            style={{ left: `${hourToPercent(h)}%` }}
          >
            {fmt(h)}
          </span>
        ))}
      </div>

      {/* One row per shift */}
      {shifts.map((shift, i) => {
        const preview = dragPreviews.get(shift.id);
        const displayShift = preview ? { ...shift, ...preview } : shift;
        const color = shift.color ?? DEFAULT_SHIFT_COLORS[i % DEFAULT_SHIFT_COLORS.length];
        const isDragging = !!preview;

        const isOvernight = displayShift.endHour <= displayShift.startHour;
        const blocks = isOvernight
          ? [
              { left: hourToPercent(displayShift.startHour), width: hourToPercent(24 - displayShift.startHour) },
              { left: 0, width: hourToPercent(displayShift.endHour) },
            ]
          : [{ left: hourToPercent(displayShift.startHour), width: hourToPercent(displayShift.endHour - displayShift.startHour) }];

        return (
          <div key={shift.id} className="flex items-center gap-2">
            {/* Shift label */}
            <div className="w-28 flex-shrink-0 flex items-center gap-1.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-text truncate font-medium">{shift.name}</span>
            </div>

            {/* Track */}
            <div
              ref={(el) => {
                if (el) trackRefs.current.set(shift.id, el);
                else trackRefs.current.delete(shift.id);
              }}
              className="relative flex-1 h-8 bg-background border border-border rounded-lg overflow-hidden"
            >
              {/* Hour grid lines */}
              {HOUR_MARKERS.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-border/30"
                  style={{ left: `${hourToPercent(h)}%` }}
                />
              ))}

              {/* Shift blocks */}
              {blocks.map((b, bi) => (
                <div
                  key={bi}
                  data-shift-id={shift.id}
                  onClick={(e) => { e.stopPropagation(); if (!isDragging) onShiftClick?.(shift); }}
                  className={`absolute top-1 bottom-1 rounded flex items-center justify-center text-white text-xs font-medium overflow-hidden group transition-opacity ${isDragging ? "opacity-95 ring-2 ring-white/50" : "opacity-85 hover:opacity-100"}`}
                  style={{ left: `${b.left}%`, width: `${b.width}%`, backgroundColor: color }}
                >
                  <span className="truncate px-1 pointer-events-none text-[11px]">
                    {isDragging
                      ? `${fmt(displayShift.startHour)} – ${fmt(displayShift.endHour)}`
                      : `${fmt(shift.startHour)} – ${fmt(shift.endHour)}`}
                  </span>
                  {!readonly && bi === 0 && (
                    <>
                      <div onMouseDown={(e) => startDrag(e, shift, "start")} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20" />
                      <div onMouseDown={(e) => startDrag(e, shift, "end")} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20" />
                      <div onMouseDown={(e) => startDrag(e, shift, "move")} className="absolute inset-2 cursor-move" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
