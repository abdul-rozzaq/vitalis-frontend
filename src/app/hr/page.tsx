"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import {
  useAdjustRecord,
  useAttendanceRecords,
  useHrSummary,
} from "@/features/attendance/hooks/use-attendance";
import { AttendanceRecord, HrSummaryRow } from "@/features/attendance/lib/attendance-api";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { ArrowLeft, Loader2, Users, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

/** "YYYY-MM" dan oy boshi/oxirini "YYYY-MM-DD" ko'rinishida qaytaradi. */
function monthRange(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function fmtHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0 && m === 0) return "—";
  if (h === 0) return `${m}m`;
  return `${h}s ${m}m`;
}

function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export default function HrControlPage() {
  const [month, setMonth] = useState(currentMonth());
  const [selected, setSelected] = useState<HrSummaryRow["user"] | null>(null);
  const { from, to } = useMemo(() => monthRange(month), [month]);

  const { data: summary, isLoading } = useHrSummary(from, to);

  return (
    <div className="space-y-0">
      <PageHeader
        title="HR nazorati"
        subtitle="Xodimlar bo'yicha oylik keldi-ketdi xulosasi"
        actions={
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setSelected(null);
            }}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        }
      />

      <PageContent>
        {selected ? (
          <EmployeeDrilldown
            user={selected}
            from={from}
            to={to}
            onBack={() => setSelected(null)}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : !summary || summary.length === 0 ? (
          <div className="text-center text-secondary py-16 flex flex-col items-center gap-2">
            <Users className="w-8 h-8 text-text-muted" />
            Shu davrda davomat yozuvlari topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-hover/50 text-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Xodim</th>
                  <th className="px-4 py-3 font-medium text-center">Smenaga chiqdi</th>
                  <th className="px-4 py-3 font-medium text-center">O'tkazib yubordi</th>
                  <th className="px-4 py-3 font-medium text-center">Ishlagan</th>
                  <th className="px-4 py-3 font-medium text-center">Kechikish</th>
                  <th className="px-4 py-3 font-medium text-center">Erta ketish</th>
                  <th className="px-4 py-3 font-medium text-center">Smenadan tashqari</th>
                  <th className="px-4 py-3 font-medium text-center">To'liqsiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.map((row) => (
                  <tr
                    key={row.user.id}
                    onClick={() => setSelected(row.user)}
                    className="hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">
                        {row.user.last_name} {row.user.first_name}
                      </div>
                      <div className="text-xs text-secondary">{row.user.role}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{row.shiftsAttended}</td>
                    <td className="px-4 py-3 text-center">
                      {row.shiftsMissed > 0 ? (
                        <span className="text-danger-600 font-medium">{row.shiftsMissed}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{fmtHours(row.workedMinutes)}</td>
                    <td className="px-4 py-3 text-center">
                      {row.lateMinutes > 0 ? (
                        <span className="text-warning-700">{fmtHours(row.lateMinutes)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.earlyLeaveMinutes > 0 ? (
                        <span className="text-warning-700">{fmtHours(row.earlyLeaveMinutes)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.overtimeMinutes > 0 ? (
                        <span className="text-primary-600 font-medium">{fmtHours(row.overtimeMinutes)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.incompleteCount > 0 ? (
                        <span className="text-danger-600 font-medium">{row.incompleteCount}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContent>
    </div>
  );
}

// ─── Xodim bo'yicha kunlik tafsilot ──────────────────────────────────────────

const statusLabel: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "O'z vaqtida", color: "bg-success-100 text-success-700 border-success-200" },
  LATE: { label: "Kechikkan", color: "bg-warning-100 text-warning-700 border-warning-200" },
  EARLY_LEAVE: { label: "Erta ketgan", color: "bg-warning-100 text-warning-700 border-warning-200" },
  LATE_AND_EARLY_LEAVE: { label: "Kech/Erta ketgan", color: "bg-danger-100 text-danger-700 border-danger-200" },
  ABSENT: { label: "Kelmagan", color: "bg-danger-100 text-danger-700 border-danger-200" },
  MISSING_CHECKOUT: { label: "Chiqish skani yo'q", color: "bg-warning-100 text-warning-700 border-warning-200" },
  MISSING_CHECKIN: { label: "Kirish skani yo'q", color: "bg-warning-100 text-warning-700 border-warning-200" },
};

function fmtTime(iso: string | null) {
  return iso ? format(new Date(iso), "HH:mm") : "-";
}

function EmployeeDrilldown({
  user,
  from,
  to,
  onBack,
}: {
  user: HrSummaryRow["user"];
  from: string;
  to: string;
  onBack: () => void;
}) {
  const { data: records = [], isLoading } = useAttendanceRecords({ userId: user.id, from, to });
  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.shift.startAt).getTime() - new Date(a.shift.startAt).getTime()),
    [records],
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Jamlangan ro&apos;yxatga qaytish
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-text">
          {user.last_name} {user.first_name}
        </h2>
        <span className="text-xs text-text-muted">{user.role}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center text-secondary py-16">Shu davrda davomat yozuvi topilmadi</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-hover/50 text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Bo&apos;lim / Smena</th>
                <th className="px-4 py-3 font-medium">Kirish</th>
                <th className="px-4 py-3 font-medium">Chiqish</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecordRow({ record }: { record: AttendanceRecord }) {
  const [editing, setEditing] = useState(false);
  const status = statusLabel[record.status] ?? { label: record.status, color: "bg-surface-secondary text-text-muted border-border" };
  const incomplete = record.status === "MISSING_CHECKIN" || record.status === "MISSING_CHECKOUT";

  return (
    <>
      <tr className="hover:bg-surface-hover transition-colors">
        <td className="px-4 py-3">{format(new Date(record.shift.startAt), "dd MMM, yyyy", { locale: uz })}</td>
        <td className="px-4 py-3">
          <div className="text-text">{record.shift.department.name}</div>
          <div className="text-xs text-secondary">
            {fmtTime(record.shift.startAt)} - {fmtTime(record.shift.endAt)}
          </div>
        </td>
        <td className="px-4 py-3 font-medium">{fmtTime(record.checkInAt)}</td>
        <td className="px-4 py-3 font-medium">{fmtTime(record.checkOutAt)}</td>
        <td className="px-4 py-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>{status.label}</span>
        </td>
        <td className="px-4 py-3">
          <Can roles={["ADMIN"]}>
            {incomplete && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Wrench className="w-3.5 h-3.5" />
                Tuzatish
              </button>
            )}
          </Can>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-surface-secondary/40">
            <ManualAdjustForm record={record} onDone={() => setEditing(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

function ManualAdjustForm({ record, onDone }: { record: AttendanceRecord; onDone: () => void }) {
  const missingCheckout = record.status === "MISSING_CHECKOUT";
  const adjust = useAdjustRecord();
  const [value, setValue] = useState(() =>
    format(new Date(missingCheckout ? record.shift.endAt : record.shift.startAt), "yyyy-MM-dd'T'HH:mm"),
  );
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Sabab kiritilishi shart");
      return;
    }
    adjust.mutate(
      {
        recordId: record.id,
        payload: {
          [missingCheckout ? "checkOutAt" : "checkInAt"]: new Date(value).toISOString(),
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Tuzatildi — audit iziga yozildi");
          onDone();
        },
        onError: () => toast.error("Xatolik yuz berdi"),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-text-muted">{missingCheckout ? "Chiqish vaqti" : "Kirish vaqti"}</span>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <span className="text-[11px] text-text-muted">Sabab (majburiy)</span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Qurilma ishlamadi / xodim unutdi"
          className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface w-full"
        />
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={adjust.isPending}
        className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
      >
        {adjust.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
        Saqlash
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-sm text-text-muted hover:text-text px-2 py-1.5"
      >
        Bekor qilish
      </button>
    </div>
  );
}
