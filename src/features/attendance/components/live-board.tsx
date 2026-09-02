"use client";

import {
  ATTENDANCE_STATUS_LABEL,
  fmtClock,
  fmtMinutes,
  fmtShiftRange,
  Shift,
  ShiftAttendanceRecord,
  ShiftStaffMember,
  SHIFT_ROLE_LABEL,
} from "@/shared/lib/shifts-api";
import { AlertTriangle, Clock, LogIn, UserX } from "lucide-react";
import React, { useMemo, useState } from "react";
import { ImagePreviewModal } from "./image-preview-modal";

/**
 * Bir xodimning ayni damdagi holati — reja (`staff`) va haqiqat (`record`)
 * birlashtirilgan ko'rinishi.
 */
type LiveState = "inside" | "late" | "left" | "absent" | "awaiting" | "incomplete";

interface LiveStaffRow {
  member: ShiftStaffMember;
  record?: ShiftAttendanceRecord;
  state: LiveState;
}

function resolveState(record: ShiftAttendanceRecord | undefined, isRunning: boolean): LiveState {
  if (!record || (!record.checkInAt && record.status !== "ABSENT")) return "awaiting";
  if (record.status === "ABSENT") return "absent";
  if (record.status === "MISSING_CHECKIN" || record.status === "MISSING_CHECKOUT") return "incomplete";
  if (record.checkInAt && !record.checkOutAt) return isRunning ? "inside" : "incomplete";
  if (record.lateMinutes > 0) return "late";
  return "left";
}

const STATE_STYLE: Record<LiveState, { dot: string; text: string; label: string }> = {
  inside: { dot: "bg-success", text: "text-success", label: "Ichkarida" },
  late: { dot: "bg-warning", text: "text-warning", label: "Kech keldi" },
  left: { dot: "bg-text-muted", text: "text-text-muted", label: "Chiqdi" },
  absent: { dot: "bg-danger", text: "text-danger", label: "Kelmadi" },
  awaiting: { dot: "bg-border", text: "text-text-muted", label: "Kutilmoqda" },
  incomplete: { dot: "bg-warning", text: "text-warning", label: "To'liqsiz" },
};

// ─── Xodim qatori ────────────────────────────────────────────────────────────

const StaffRow: React.FC<{ row: LiveStaffRow; onPictureClick?: (src: string) => void }> = ({
  row,
  onPictureClick,
}) => {
  const { member, record, state } = row;
  const style = STATE_STYLE[state];
  const isLate = (record?.lateMinutes ?? 0) > 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
      {record?.checkInPicture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={record.checkInPicture}
          alt=""
          className={`w-10 h-10 rounded-full object-cover border-2 shrink-0 ${
            state === "absent" ? "border-danger" : isLate ? "border-warning" : "border-success"
          } ${onPictureClick ? "cursor-pointer hover:opacity-90 hover:scale-105 transition-all" : ""}`}
          title={
            onPictureClick
              ? "Kirish skanidagi yuz rasmi — kattalashtirish uchun bosing"
              : "Kirish skanidagi yuz rasmi"
          }
          onClick={() => record.checkInPicture && onPictureClick?.(record.checkInPicture)}
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full border-2 border-border shrink-0 flex items-center justify-center text-xs font-semibold text-text-muted ${
            member.role === "DOCTOR" ? "bg-info-50" : "bg-success-50"
          }`}
        >
          {member.user.first_name.charAt(0)}
          {member.user.last_name.charAt(0)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text truncate">
          {member.user.first_name} {member.user.last_name}
        </p>
        <p className="text-xs text-text-muted">{SHIFT_ROLE_LABEL[member.role]}</p>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center justify-end gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className={`text-xs font-medium ${style.text}`}>
            {record ? ATTENDANCE_STATUS_LABEL[record.status] : style.label}
          </span>
        </div>
        <p className="text-[11px] text-text-muted tabular-nums mt-0.5">
          {record?.checkInAt ? (
            <>
              {fmtClock(record.checkInAt)}
              {record.checkOutAt && ` – ${fmtClock(record.checkOutAt)}`}
              {isLate && <span className="text-warning"> · +{fmtMinutes(record.lateMinutes)}</span>}
              {!isLate && record.workedMinutes > 0 && ` · ${fmtMinutes(record.workedMinutes)}`}
            </>
          ) : (
            "—"
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Smena kartasi ───────────────────────────────────────────────────────────

const ShiftGroup: React.FC<{ shift: Shift; onPictureClick?: (src: string) => void }> = ({
  shift,
  onPictureClick,
}) => {
  const byUser = useMemo(
    () => new Map(shift.attendanceRecords.map((r) => [r.userId, r])),
    [shift.attendanceRecords],
  );

  const rows: LiveStaffRow[] = shift.staff.map((member) => {
    const record = byUser.get(member.userId);
    return { member, record, state: resolveState(record, shift.attendance.isRunning) };
  });

  const nobodyCame = shift.attendance.isRunning && shift.attendance.arrived === 0 && shift.staff.length > 0;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border-light flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {shift.attendance.isRunning && (
              <span className="relative flex w-2 h-2 shrink-0" title="Smena davom etyapti">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-full w-full bg-primary" />
              </span>
            )}
            <h3 className="text-sm font-semibold text-text truncate">
              {shift.department.name}
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {shift.note || "Smena"} · {fmtShiftRange(shift.startAt, shift.endAt)}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-text tabular-nums">
            {shift.attendance.arrived}/{shift.attendance.expected}
          </p>
          <p className="text-[11px] text-text-muted">keldi</p>
        </div>
      </div>

      {nobodyCame && (
        <div className="px-4 py-2.5 bg-danger-50 border-b border-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Hech kim kelmagan — {shift.staff.length} xodim kutilmoqda
          </p>
        </div>
      )}

      <div className="p-1.5">
        {rows.length > 0 ? (
          rows.map((row) => (
            <StaffRow key={row.member.userId} row={row} onPictureClick={onPictureClick} />
          ))
        ) : (
          <p className="px-3 py-4 text-sm text-text-muted italic text-center">
            Xodim biriktirilmagan
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Asosiy ko'rinish ────────────────────────────────────────────────────────

interface LiveBoardProps {
  shifts: Shift[];
  isLoading: boolean;
}

export const LiveBoard: React.FC<LiveBoardProps> = ({ shifts, isLoading }) => {
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);

  /*
    Tartib: avval davom etayotgan smenalar, keyin bugun tugaganlar, oxirida
    hali boshlanmaganlar. Diqqat talab qiladigan narsa doim tepada bo'ladi.
    Ichida — hech kim kelmagan smenalar birinchi.
    Vaqtga bog'liq `Date.now()` render ichida chaqirilmaydi: tartib backend
    bergan `isRunning` bayrog'iga tayanadi.
  */
  const ordered = useMemo(() => {
    const rank = (s: Shift) => {
      if (s.attendance.isRunning) return s.attendance.arrived === 0 ? 0 : 1;
      return s.attendance.arrived > 0 || s.attendance.absent > 0 ? 2 : 3;
    };
    return [...shifts].sort(
      (a, b) => rank(a) - rank(b) || new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [shifts]);

  const totals = useMemo(() => {
    const running = shifts.filter((s) => s.attendance.isRunning);
    return {
      inside: running.reduce((n, s) => n + s.attendance.insideNow, 0),
      awaiting: running.reduce(
        (n, s) => n + Math.max(0, s.attendance.expected - s.attendance.arrived),
        0,
      ),
      late: shifts.reduce((n, s) => n + s.attendance.late, 0),
      absent: shifts.reduce((n, s) => n + s.attendance.absent, 0),
      emptyShifts: running.filter((s) => s.attendance.arrived === 0 && s.staff.length > 0).length,
    };
  }, [shifts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <Clock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">Bugun uchun smena yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Xulosa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryTile icon={<LogIn className="w-4 h-4" />} value={totals.inside} label="Hozir ichkarida" tone="success" />
        <SummaryTile icon={<Clock className="w-4 h-4" />} value={totals.awaiting} label="Kutilmoqda" tone="muted" />
        <SummaryTile icon={<AlertTriangle className="w-4 h-4" />} value={totals.late} label="Kechikdi" tone="warning" />
        <SummaryTile icon={<UserX className="w-4 h-4" />} value={totals.absent} label="Kelmadi" tone="danger" />
      </div>

      {totals.emptyShifts > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-danger-50 border border-danger">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            {totals.emptyShifts} ta faol smenada hech kim kelmagan
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ordered.map((shift) => (
          <ShiftGroup
            key={shift.id}
            shift={shift}
            onPictureClick={setSelectedPicture}
          />
        ))}
      </div>

      <ImagePreviewModal
        src={selectedPicture}
        onClose={() => setSelectedPicture(null)}
      />
    </div>
  );
};

const SummaryTile: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
}> = ({ icon, value, label, tone }) => {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-text-muted",
  }[tone];

  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className={`flex items-center gap-1.5 ${toneClass}`}>
        {icon}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
};
