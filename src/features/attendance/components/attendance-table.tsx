"use client";

import { AttendanceRecord, AttendanceRecordStatus } from "../lib/attendance-api";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onRowClick?: (record: AttendanceRecord) => void;
}

const statusConfig: Record<AttendanceRecordStatus, { label: string; color: string }> = {
  PRESENT: { label: "O'z vaqtida", color: "bg-success-100 text-success-700 border-success-200" },
  LATE: { label: "Kechikkan", color: "bg-warning-100 text-warning-700 border-warning-200" },
  EARLY_LEAVE: { label: "Erta ketgan", color: "bg-warning-100 text-warning-700 border-warning-200" },
  LATE_AND_EARLY_LEAVE: { label: "Kech/Erta ketgan", color: "bg-danger-100 text-danger-700 border-danger-200" },
  ABSENT: { label: "Kelmagan", color: "bg-danger-100 text-danger-700 border-danger-200" },
  MISSING_CHECKOUT: {
    label: "Chiqish skani yo'q",
    color: "bg-warning-100 text-warning-700 border-warning-200",
  },
  MISSING_CHECKIN: {
    label: "Kirish skani yo'q",
    color: "bg-warning-100 text-warning-700 border-warning-200",
  },
};

function formatTime(isoStr: string | null) {
  if (!isoStr) return "-";
  return format(new Date(isoStr), "HH:mm");
}

function formatDate(isoStr: string | null) {
  if (!isoStr) return "-";
  return format(new Date(isoStr), "dd MMM, yyyy", { locale: uz });
}

export function AttendanceTable({ records, onRowClick }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-secondary border border-border rounded-xl bg-surface">
        Davomat yozuvlari topilmadi
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface-hover/50 text-secondary border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium">Xodim</th>
            <th className="px-4 py-3 font-medium">Sana</th>
            <th className="px-4 py-3 font-medium">Bo'lim / Smena</th>
            <th className="px-4 py-3 font-medium">Kirish</th>
            <th className="px-4 py-3 font-medium">Chiqish</th>
            <th className="px-4 py-3 font-medium text-center">Kechikish</th>
            <th className="px-4 py-3 font-medium">Holat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((record) => {
            const status = statusConfig[record.status];
            
            return (
              <tr 
                key={record.id} 
                className={`hover:bg-surface-hover transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(record)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-text">
                    {record.user.last_name} {record.user.first_name}
                  </div>
                  <div className="text-xs text-secondary">{record.user.role}</div>
                </td>
                <td className="px-4 py-3">
                  {formatDate(record.shift.startAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-text">{record.shift.department.name}</div>
                  <div className="text-xs text-secondary">
                    {formatTime(record.shift.startAt)} - {formatTime(record.shift.endAt)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatTime(record.checkInAt)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatTime(record.checkOutAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  {record.lateMinutes > 0 ? (
                    <span className="text-danger-600 font-medium">+{record.lateMinutes}m</span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
