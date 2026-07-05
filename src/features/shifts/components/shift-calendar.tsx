"use client";

import type { Shift } from "@/shared/lib/shifts-api";
import { departmentColor, fmtShiftRange, isOvernight } from "@/shared/lib/shifts-api";
import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { StaffingBadge } from "./staffing-badge";

const WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

/** Qo'lda yozilgan haftalik kalendar — smenalar boshlanish kuni ustuni ostida. */
export function ShiftCalendar({
  weekStart,
  shifts,
  onPrev,
  onNext,
  onToday,
  onSelect,
  onCreateForDay,
}: {
  weekStart: Date;
  shifts: Shift[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelect: (s: Shift) => void;
  onCreateForDay: (day: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-2 border border-border rounded-lg text-text-muted hover:bg-surface-hover">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onToday} className="px-3 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">
            Bugun
          </button>
          <button onClick={onNext} className="p-2 border border-border rounded-lg text-text-muted hover:bg-surface-hover">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm font-medium text-text">
          {format(weekStart, "dd MMM")} – {format(addDays(weekStart, 6), "dd MMM yyyy")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {days.map((day, i) => {
          const dayShifts = shifts.filter((s) => isSameDay(new Date(s.startAt), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="border border-border rounded-xl bg-surface min-h-[150px] flex flex-col group/day">
              <div className={`flex items-center justify-between px-2.5 py-2 border-b border-border ${isToday ? "bg-primary/5" : "bg-background"}`}>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-text-muted">{WEEKDAYS[i]}</span>
                  <span className={`text-sm font-semibold ${isToday ? "text-primary" : "text-text"}`}>{format(day, "d")}</span>
                </div>
                <button
                  onClick={() => onCreateForDay(day)}
                  className="p-1 text-text-muted hover:text-primary rounded opacity-0 group-hover/day:opacity-100 transition-opacity"
                  title="Smena qo'shish"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-1.5 space-y-1.5 flex-1">
                {dayShifts.length === 0 && <div className="h-full min-h-[60px]" />}
                {dayShifts.map((s) => {
                  const color = departmentColor(s.departmentId);
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s)}
                      className="w-full text-left rounded-lg border border-border bg-background hover:shadow-sm transition-all p-2"
                      style={{ borderLeft: `3px solid ${color}` }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-text truncate">{s.department.name}</span>
                        {isOvernight(s.startAt, s.endAt) && <span className="text-[10px] text-text-muted flex-shrink-0">+1</span>}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">{fmtShiftRange(s.startAt, s.endAt)}</div>
                      <div className="mt-1.5">
                        <StaffingBadge staffing={s.staffing} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
