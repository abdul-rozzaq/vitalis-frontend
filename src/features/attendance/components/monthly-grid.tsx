"use client";

import { fmtMinutes } from "@/shared/lib/shifts-api";
import { format } from "date-fns";
import React, { useMemo } from "react";
import { AttendanceRecord, AttendanceRecordStatus } from "../lib/attendance-api";

/** `Date.getDay()` (0 = yakshanba) bo'yicha indekslanadi. */
const WEEKDAY_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

/** Katak ko'rinishi — status bo'yicha belgi va rang. */
const CELL: Record<AttendanceRecordStatus, { mark: string; className: string; label: string }> = {
  PRESENT: { mark: "✓", className: "bg-success-50 text-success", label: "Keldi" },
  LATE: { mark: "⚠", className: "bg-warning-50 text-warning", label: "Kech keldi" },
  EARLY_LEAVE: { mark: "⚠", className: "bg-warning-50 text-warning", label: "Erta ketdi" },
  LATE_AND_EARLY_LEAVE: {
    mark: "⚠",
    className: "bg-warning-50 text-warning",
    label: "Kech keldi, erta ketdi",
  },
  ABSENT: { mark: "✗", className: "bg-danger-50 text-danger", label: "Kelmadi" },
  MISSING_CHECKOUT: { mark: "⊘", className: "bg-warning-50 text-warning", label: "Chiqish skani yo'q" },
  MISSING_CHECKIN: { mark: "⊘", className: "bg-warning-50 text-warning", label: "Kirish skani yo'q" },
};

interface MonthlyGridProps {
  records: AttendanceRecord[];
  /** Ustunlar uchun oy — "yyyy-MM". */
  month: string;
  isLoading: boolean;
}

interface UserRow {
  userId: string;
  name: string;
  role: string;
  /** dayKey → yozuv */
  byDay: Map<string, AttendanceRecord>;
  workedMinutes: number;
  lateMinutes: number;
  absentDays: number;
}

export const MonthlyGrid: React.FC<MonthlyGridProps> = ({ records, month, isLoading }) => {
  /** Oydagi barcha kunlar — ma'lumot bo'lmagan kunlar ham ustun bo'lib qoladi. */
  const days = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    return Array.from({ length: count }, (_, i) => ({
      key: `${month}-${String(i + 1).padStart(2, "0")}`,
      date: new Date(y, m - 1, i + 1),
    }));
  }, [month]);

  const rows = useMemo(() => {
    const map = new Map<string, UserRow>();

    for (const rec of records) {
      let row = map.get(rec.userId);
      if (!row) {
        row = {
          userId: rec.userId,
          name: `${rec.user.first_name} ${rec.user.last_name}`,
          role: rec.user.role,
          byDay: new Map(),
          workedMinutes: 0,
          lateMinutes: 0,
          absentDays: 0,
        };
        map.set(rec.userId, row);
      }

      row.byDay.set(format(new Date(rec.shift.startAt), "yyyy-MM-dd"), rec);
      row.workedMinutes += rec.workedMinutes;
      row.lateMinutes += rec.lateMinutes;
      if (rec.status === "ABSENT") row.absentDays += 1;
    }

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-sm text-text-muted">Bu oy uchun davomat yozuvi yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-xl overflow-auto max-h-[65vh]">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-surface-secondary border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold text-text-muted w-44 min-w-44">
                Xodim
              </th>
              {days.map((day) => {
                const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                return (
                  <th
                    key={day.key}
                    className={`sticky top-0 z-20 border-b border-border px-1 py-2 w-9 min-w-9 ${
                      isWeekend ? "bg-surface-hover" : "bg-surface-secondary"
                    }`}
                  >
                    <div className="text-[9px] font-medium text-text-muted leading-tight">
                      {WEEKDAY_SHORT[day.date.getDay()]}
                    </div>
                    <div className="text-[11px] font-semibold text-text leading-tight tabular-nums">
                      {day.date.getDate()}
                    </div>
                  </th>
                );
              })}
              <th className="sticky right-0 top-0 z-30 bg-surface-secondary border-b border-l border-border px-3 py-2 text-right text-[11px] font-semibold text-text-muted w-32 min-w-32">
                Jami
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <th className="sticky left-0 z-10 bg-surface border-b border-r border-border px-3 py-1.5 text-left w-44 min-w-44">
                  <div className="text-xs font-medium text-text truncate">{row.name}</div>
                  <div className="text-[10px] text-text-muted">{row.role}</div>
                </th>

                {days.map((day) => {
                  const rec = row.byDay.get(day.key);
                  if (!rec) {
                    return (
                      <td
                        key={day.key}
                        className="border-b border-border-light text-center text-text-muted/30 text-xs w-9 min-w-9"
                      >
                        –
                      </td>
                    );
                  }
                  const cell = CELL[rec.status];
                  return (
                    <td key={day.key} className="border-b border-border-light p-0.5 w-9 min-w-9">
                      <div
                        title={`${cell.label}${rec.lateMinutes ? ` · +${fmtMinutes(rec.lateMinutes)}` : ""}${
                          rec.workedMinutes ? ` · ${fmtMinutes(rec.workedMinutes)}` : ""
                        }`}
                        className={`h-6 rounded flex items-center justify-center text-xs font-semibold ${cell.className}`}
                      >
                        {cell.mark}
                      </div>
                    </td>
                  );
                })}

                <td className="sticky right-0 z-10 bg-surface border-b border-l border-border px-3 py-1.5 text-right w-32 min-w-32">
                  <div className="text-xs font-medium text-text tabular-nums">
                    {fmtMinutes(row.workedMinutes) || "0daq"}
                  </div>
                  <div className="text-[10px] tabular-nums">
                    {row.lateMinutes > 0 && (
                      <span className="text-warning">+{fmtMinutes(row.lateMinutes)} kech</span>
                    )}
                    {row.lateMinutes > 0 && row.absentDays > 0 && (
                      <span className="text-text-muted"> · </span>
                    )}
                    {row.absentDays > 0 && (
                      <span className="text-danger">{row.absentDays} kelmadi</span>
                    )}
                    {row.lateMinutes === 0 && row.absentDays === 0 && (
                      <span className="text-success">toza</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Belgilar izohi */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted px-1">
        <Legend mark="✓" className="bg-success-50 text-success" label="Keldi" />
        <Legend mark="⚠" className="bg-warning-50 text-warning" label="Kech keldi / erta ketdi" />
        <Legend mark="⊘" className="bg-warning-50 text-warning" label="Skan to'liqsiz" />
        <Legend mark="✗" className="bg-danger-50 text-danger" label="Kelmadi" />
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded flex items-center justify-center text-text-muted/30">–</span>
          Smena yo&apos;q
        </span>
      </div>
    </div>
  );
};

const Legend: React.FC<{ mark: string; className: string; label: string }> = ({
  mark,
  className,
  label,
}) => (
  <span className="flex items-center gap-1.5">
    <span className={`w-5 h-5 rounded flex items-center justify-center font-semibold ${className}`}>
      {mark}
    </span>
    {label}
  </span>
);
