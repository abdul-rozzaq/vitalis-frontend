"use client";

import { fmtShiftRange } from "@/shared/lib/shifts-api";
import { format, isSameDay } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ScanFace,
  UserPlus,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  useAdjustRecord,
  useAssignEventToShift,
  useLinkEmployee,
  useUnresolved,
} from "../hooks/use-attendance";
import {
  NoShiftGroup,
  StaffRef,
  UnknownEmployeeGroup,
  UnresolvedRecord,
} from "../lib/attendance-api";

/** Bir necha skanning vaqt oralig'i — `05.08 09:12 → 11:40` yoki bitta vaqt. */
function fmtRange(firstAt: string, lastAt: string, count: number): string {
  const first = new Date(firstAt);
  const last = new Date(lastAt);
  if (count === 1) return format(first, "dd.MM HH:mm");
  if (isSameDay(first, last)) {
    return `${format(first, "dd.MM HH:mm")} → ${format(last, "HH:mm")}`;
  }
  return `${format(first, "dd.MM HH:mm")} → ${format(last, "dd.MM HH:mm")}`;
}

// ─── Umumiy karta qobig'i ────────────────────────────────────────────────────

const ExceptionCard: React.FC<{
  picture: string | null;
  icon: React.ReactNode;
  time: string;
  title: string;
  count?: number;
  problem: string;
  tone: "danger" | "warning";
  children: React.ReactNode;
}> = ({ picture, icon, time, title, count, problem, tone, children }) => (
  <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
    <div className="flex gap-3">
      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt=""
          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
          title="Terminaldagi yuz rasmi"
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-lg shrink-0 flex items-center justify-center ${
            tone === "danger" ? "bg-danger-50 text-danger" : "bg-warning-50 text-warning"
          }`}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-text truncate">{title}</span>
          {!!count && count > 1 && (
            <span
              className="shrink-0 text-[11px] font-semibold px-1.5 py-px rounded-full bg-surface-secondary text-text-secondary tabular-nums"
              title={`${count} ta skan bitta muammoga birlashtirildi`}
            >
              ×{count}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-muted tabular-nums mt-0.5">{time}</p>
        <p className={`text-xs mt-1 ${tone === "danger" ? "text-danger" : "text-warning"}`}>
          {problem}
        </p>
      </div>
    </div>

    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

// ─── Bog'lanmagan terminal ID ────────────────────────────────────────────────

const UnknownEmployeeCard: React.FC<{ group: UnknownEmployeeGroup; staff: StaffRef[] }> = ({
  group,
  staff,
}) => {
  const [userId, setUserId] = useState("");
  const link = useLinkEmployee();

  const submit = () => {
    if (!userId) return;
    link.mutate(
      { eventId: group.latestEventId, userId },
      {
        onSuccess: (res: unknown) => {
          const r = res as { reprocessed?: number };
          toast.success(
            r.reprocessed
              ? `Bog'landi — ${r.reprocessed} ta skan qayta ishlandi`
              : "Terminal ID xodimga bog'landi",
          );
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e.response?.data?.message ?? "Xatolik yuz berdi");
        },
      },
    );
  };

  return (
    <ExceptionCard
      picture={group.picturePath}
      icon={<ScanFace className="w-5 h-5" />}
      time={fmtRange(group.firstAt, group.lastAt, group.count)}
      title={`Terminal ID ${group.employeeNoStr}`}
      count={group.count}
      problem="Bu ID hech qaysi xodimga bog'lanmagan"
      tone="danger"
    >
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface w-full"
      >
        <option value="">Xodimni tanlang…</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.first_name} {s.last_name} — {s.role}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        disabled={!userId || link.isPending}
        className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {link.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Bog&apos;lash
        {group.count > 1 && <span className="opacity-80">({group.count} skan)</span>}
      </button>
      {staff.length === 0 && (
        <p className="text-[11px] text-text-muted italic">
          Face ID bog&apos;lanmagan xodim qolmadi — bu ID begona bo&apos;lishi mumkin.
        </p>
      )}
    </ExceptionCard>
  );
};

// ─── Smenasi topilmagan skanlar ──────────────────────────────────────────────

const NoShiftCard: React.FC<{ group: NoShiftGroup }> = ({ group }) => {
  const assign = useAssignEventToShift();
  const suggested = group.suggestedShift;

  const submit = () => {
    if (!suggested) return;
    assign.mutate(
      { eventId: group.latestEventId, shiftId: suggested.id },
      {
        onSuccess: (res: unknown) => {
          const r = res as { matched?: number };
          toast.success(
            r.matched ? `Biriktirildi — ${r.matched} ta skan hisobga olindi` : "Biriktirildi",
          );
        },
        onError: () => toast.error("Xatolik yuz berdi"),
      },
    );
  };

  return (
    <ExceptionCard
      picture={group.picturePath}
      icon={<CalendarClock className="w-5 h-5" />}
      time={fmtRange(group.firstAt, group.lastAt, group.count)}
      title={
        group.user
          ? `${group.user.first_name} ${group.user.last_name}`
          : `ID ${group.employeeNoStr}`
      }
      count={group.count}
      problem="Bu vaqtda smenasi yo'q"
      tone="warning"
    >
      {suggested ? (
        <>
          <div className="bg-surface-secondary border border-border-light rounded-md px-2.5 py-2">
            <p className="text-[11px] text-text-muted">Yaqin smena</p>
            <p className="text-sm font-medium text-text truncate">
              {suggested.note || "Smena"} · {fmtShiftRange(suggested.startAt, suggested.endAt)}
            </p>
            <p className="text-xs text-text-muted truncate">{suggested.department.name}</p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={assign.isPending}
            className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {assign.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarClock className="w-4 h-4" />
            )}
            Shu smenaga biriktirish
          </button>
        </>
      ) : (
        <p className="text-sm text-text-muted italic">
          Yaqin atrofda mos smena topilmadi — smenani qo&apos;lda yaratish kerak.
        </p>
      )}
    </ExceptionCard>
  );
};

// ─── To'liqsiz yozuv ─────────────────────────────────────────────────────────

const IncompleteRecordCard: React.FC<{ record: UnresolvedRecord }> = ({ record }) => {
  const missingCheckout = record.status === "MISSING_CHECKOUT";
  const adjust = useAdjustRecord();

  /** `datetime-local` uchun boshlang'ich qiymat — smena chegarasi. */
  const [value, setValue] = useState(() =>
    format(
      new Date(missingCheckout ? record.shift.endAt : record.shift.startAt),
      "yyyy-MM-dd'T'HH:mm",
    ),
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
        onSuccess: () => toast.success("Tuzatildi — audit iziga yozildi"),
        onError: () => toast.error("Xatolik yuz berdi"),
      },
    );
  };

  return (
    <ExceptionCard
      picture={null}
      icon={<Wrench className="w-5 h-5" />}
      time={`${format(new Date(record.shift.startAt), "dd.MM")} · ${fmtShiftRange(
        record.shift.startAt,
        record.shift.endAt,
      )}`}
      title={`${record.user.first_name} ${record.user.last_name}`}
      problem={`${missingCheckout ? "Chiqish" : "Kirish"} skani yo'q · ${
        record.shift.note || "Smena"
      }`}
      tone="warning"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-text-muted">
          {missingCheckout ? "Chiqish vaqti" : "Kirish vaqti"}
        </span>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface w-full"
        />
      </label>
      <label className="flex flex-col gap-1">
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
        className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {adjust.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
        Tuzatish
      </button>
      <p className="text-[11px] text-text-muted">
        Xom skan o&apos;zgarmaydi — tuzatish kim, qachon va nima sababdan qilgani bilan saqlanadi.
      </p>
    </ExceptionCard>
  );
};

// ─── Navbat ──────────────────────────────────────────────────────────────────

/** Bo'lim sarlavhasi — bo'sh bo'lsa umuman render qilinmaydi. */
const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({
  title,
  count,
  children,
}) => {
  if (!count) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
        {title} <span className="tabular-nums font-normal">({count})</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 items-start">
        {children}
      </div>
    </section>
  );
};

export const UnresolvedQueue: React.FC = () => {
  const { data, isLoading } = useUnresolved();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const total = data.totals.unknownEmployees + data.totals.noShift + data.totals.records;

  return (
    <div className="space-y-6">
      {data.totals.unlinkedStaff > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-warning-50 border border-warning">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">
              {data.totals.unlinkedStaff} xodimda Face ID bog&apos;lanmagan
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {data.unlinkedStaff
                .slice(0, 6)
                .map((s) => `${s.first_name} ${s.last_name}`)
                .join(", ")}
              {data.unlinkedStaff.length > 6 && ` va yana ${data.unlinkedStaff.length - 6} ta`}
              {" — "}ularning skanlari hech qachon hisobga olinmaydi.
            </p>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="text-sm text-text-muted">Hal qilinmagan skan yo&apos;q</p>
        </div>
      ) : (
        <>
          <Section title="Bog'lanmagan terminal ID" count={data.totals.unknownEmployees}>
            {data.unknownEmployees.map((group) => (
              <UnknownEmployeeCard key={group.key} group={group} staff={data.unlinkedStaff} />
            ))}
          </Section>

          <Section title="Smenasi topilmagan skanlar" count={data.totals.noShift}>
            {data.noShift.map((group) => (
              <NoShiftCard key={group.key} group={group} />
            ))}
          </Section>

          <Section title="To'liqsiz yozuvlar" count={data.totals.records}>
            {data.records.map((record) => (
              <IncompleteRecordCard key={record.id} record={record} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
};
