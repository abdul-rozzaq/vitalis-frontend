"use client";

import { AttendanceRecord } from "../lib/attendance-api";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Users } from "lucide-react";

interface AttendanceStatsCardsProps {
  records: AttendanceRecord[];
}

export function AttendanceStatsCards({ records }: AttendanceStatsCardsProps) {
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE" || r.status === "LATE_AND_EARLY_LEAVE").length;
  const earlyLeave = records.filter((r) => r.status === "EARLY_LEAVE" || r.status === "LATE_AND_EARLY_LEAVE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Jami */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">Jami Shiftlar</p>
          <p className="text-2xl font-bold text-text mt-1">{total}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary-600" />
        </div>
      </div>

      {/* O'z vaqtida */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">O'z vaqtida</p>
          <p className="text-2xl font-bold text-success-600 mt-1">{present}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-success-600" />
        </div>
      </div>

      {/* Kech kelgan */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">Kech kelgan</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">{late}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-warning-600" />
        </div>
      </div>

      {/* Erta ketgan */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">Erta ketgan</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">{earlyLeave}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning-600" />
        </div>
      </div>

      {/* Skanlanmagan / Absent */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">Kelmagan</p>
          <p className="text-2xl font-bold text-danger-600 mt-1">{absent}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5 text-danger-600" />
        </div>
      </div>
    </div>
  );
}
