"use client";
import { useTranslations } from "next-intl";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/shared/lib/api";
import { fmtHM, ResolvedSlot, shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type View = "day" | "week" | "month";
interface Staff { id: string; first_name: string; last_name: string; role: string }

// ─── Date helpers (UTC calendar, clinic uses Asia/Tashkent dates) ──────────────
function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function startOfWeek(d: Date) { const x = new Date(d); const day = (x.getUTCDay() + 6) % 7; return addDays(x, -day); }
function startOfMonth(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function endOfMonth(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); }
const DOW = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

export default function ShiftCalendarPage() {
  const t = useTranslations();
  const qc = useQueryClient();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date(ymd(new Date())));
  const [drawer, setDrawer] = useState<ResolvedSlot | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { from: ymd(anchor), to: ymd(anchor) };
    if (view === "week") { const s = startOfWeek(anchor); return { from: ymd(s), to: ymd(addDays(s, 6)) }; }
    const s = startOfMonth(anchor); const e = endOfMonth(anchor); return { from: ymd(s), to: ymd(e) };
  }, [view, anchor]);

  const { data: slots = [], isLoading } = useQuery<ResolvedSlot[]>({
    queryKey: ["resolved-range", range.from, range.to],
    queryFn: () => shiftsApi.resolvedRange(range),
  });

  const days = useMemo(() => {
    const out: Date[] = [];
    const from = new Date(range.from); const to = new Date(range.to);
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) out.push(new Date(d));
    return out;
  }, [range]);

  function shift(n: number) {
    const mult = view === "day" ? 1 : view === "week" ? 7 : 0;
    if (view === "month") { setAnchor((a) => new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + n, 1))); return; }
    setAnchor((a) => addDays(a, n * mult));
  }

  const title = view === "month"
    ? `${MONTHS[anchor.getUTCMonth()]} ${anchor.getUTCFullYear()}`
    : view === "week"
      ? `${ymd(startOfWeek(anchor))} — ${ymd(addDays(startOfWeek(anchor), 6))}`
      : ymd(anchor);

  return (
    <>
      <PageHeader
        title="Smena kalendari"
        subtitle="Kunlik, haftalik va oylik smena jadvali"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              {(["day", "week", "month"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm transition-colors ${view === v ? "bg-primary text-white" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {v === "day" ? "Kun" : v === "week" ? "Hafta" : "Oy"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <PageContent>
        {/* Navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => shift(-1)} className="p-2 border border-border rounded-lg hover:bg-surface-hover text-text"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setAnchor(new Date(ymd(new Date())))} className="px-3 py-2 border border-border rounded-lg hover:bg-surface-hover text-text text-sm">Bugun</button>
            <button onClick={() => shift(1)} className="p-2 border border-border rounded-lg hover:bg-surface-hover text-text"><ChevronRight className="w-4 h-4" /></button>
            <span className="ml-2 font-semibold text-text">{title}</span>
          </div>
          <span className="text-sm text-text-muted">{slots.length} ta slot</span>
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-16"><CalendarDays className="w-8 h-8 mx-auto opacity-30 animate-pulse" /></div>
        ) : view === "month" ? (
          <MonthView anchor={anchor} slots={slots} />
        ) : (
          <WeekDayGrid days={days} slots={slots} onSlotClick={setDrawer} />
        )}
      </PageContent>

      {drawer && <QuickAssignDrawer slot={drawer} onClose={() => setDrawer(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["resolved-range"] }); setDrawer(null); }} />}
    </>
  );
}

// ─── Week / Day grid: rows = shift templates, cols = days ──────────────────────
function WeekDayGrid({ days, slots, onSlotClick }: { days: Date[]; slots: ResolvedSlot[]; onSlotClick: (s: ResolvedSlot) => void }) {
  // group by shift template
  const shiftMap = new Map<string, { name: string; startHour: number; endHour: number }>();
  slots.forEach((s) => { if (!shiftMap.has(s.shift.id)) shiftMap.set(s.shift.id, s.shift); });
  const shiftRows = [...shiftMap.entries()];

  if (shiftRows.length === 0) {
    return <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Bu davrda smena yo'q</p></div>;
  }

  const todayStr = ymd(new Date());

  return (
    <div className="overflow-x-auto border border-border rounded-xl bg-surface">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 font-medium text-text-muted sticky left-0 bg-surface w-40">Smena</th>
            {days.map((d) => {
              const isToday = ymd(d) === todayStr;
              return <th key={ymd(d)} className={`p-2 text-center font-medium min-w-[120px] ${isToday ? "text-primary" : "text-text-muted"}`}>
                <div>{DOW[(d.getUTCDay() + 6) % 7]}</div>
                <div className="text-xs">{d.getUTCDate()}</div>
              </th>;
            })}
          </tr>
        </thead>
        <tbody>
          {shiftRows.map(([sid, sh]) => (
            <tr key={sid} className="border-b border-border last:border-0">
              <td className="p-3 sticky left-0 bg-surface align-top">
                <div className="font-medium text-text">{sh.name}</div>
                <div className="text-xs text-text-muted">{fmtHM(sh.startHour)}–{fmtHM(sh.endHour)}</div>
              </td>
              {days.map((d) => {
                const cell = slots.filter((s) => s.shift.id === sid && s.date.slice(0, 10) === ymd(d));
                return (
                  <td key={ymd(d)} className="p-1.5 align-top">
                    <div className="space-y-1">
                      {cell.map((s, i) => (
                        <button key={i} onClick={() => onSlotClick(s)}
                          className={`w-full text-left px-2 py-1 rounded-md border text-xs transition-colors hover:shadow-sm ${
                            s.source === "none" ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-success-50 border-success-100 text-success"}`}>
                          <div className="font-medium truncate">{s.room.name}</div>
                          <div className="truncate text-[11px] opacity-80">
                            {s.doctor ? `${s.doctor.first_name} ${s.doctor.last_name}` : "— biriktirilmagan"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Month view: calendar grid with shift counts ──────────────────────────────
function MonthView({ anchor, slots }: { anchor: Date; slots: ResolvedSlot[] }) {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  const todayStr = ymd(new Date());

  const byDay = new Map<string, ResolvedSlot[]>();
  slots.forEach((s) => { const k = s.date.slice(0, 10); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k)!.push(s); });

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {DOW.map((d) => <div key={d} className="p-2 text-center text-xs font-medium text-text-muted">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const inMonth = d.getUTCMonth() === anchor.getUTCMonth();
          const isToday = ymd(d) === todayStr;
          const dayShifts = byDay.get(ymd(d)) ?? [];
          const unassigned = dayShifts.filter((s) => s.source === "none").length;
          return (
            <div key={ymd(d)} className={`min-h-[92px] p-1.5 border-r border-b border-border ${inMonth ? "" : "bg-background/50"}`}>
              <div className={`text-xs mb-1 ${isToday ? "font-bold text-primary" : inMonth ? "text-text" : "text-text-muted"}`}>{d.getUTCDate()}</div>
              {dayShifts.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted">{dayShifts.length} smena</span>
                  {unassigned > 0 && <div className="text-[10px] bg-amber-50 text-amber-700 px-1 rounded">{unassigned} bo'sh</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick assignment drawer ──────────────────────────────────────────────────
function QuickAssignDrawer({ slot, onClose, onSaved }: { slot: ResolvedSlot; onClose: () => void; onSaved: () => void }) {
  const [doctorId, setDoctorId] = useState(slot.doctor?.id ?? "");
  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["staff-list"], queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data) });
  const doctors = staff.filter((s) => s.role === "DOCTOR");

  const save = useMutation({
    mutationFn: () => shiftsApi.bulkAssign({ roomShiftId: slot.shift.id, roomId: slot.room.id, dates: [slot.date.slice(0, 10)], doctorId }),
    onSuccess: () => { toast.success("Tayinlandi"); onSaved(); },
    onError: () => toast.error("Xatolik"),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-[420px] bg-surface border-l border-border h-full p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text">Tezkor tayinlash</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Smena" value={slot.shift.name} />
          <Row label="Xona" value={slot.room.name} />
          <Row label="Sana" value={slot.date.slice(0, 10)} />
          <Row label="Vaqt" value={`${fmtHM(slot.shift.startHour)}–${fmtHM(slot.shift.endHour)}`} />
          <Row label="Hozirgi" value={slot.doctor ? `${slot.doctor.first_name} ${slot.doctor.last_name}` : "biriktirilmagan"} />

          <div className="pt-2">
            <label className="text-xs text-text-muted block mb-1">Shifokor tayinlash</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
              <option value="">— Tanlang —</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">Bekor</button>
          <button onClick={() => save.mutate()} disabled={!doctorId || save.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
            {save.isPending ? "Saqlanmoqda..." : "Tayinlash (override)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-text-muted">{label}</span><span className="text-text font-medium text-right">{value}</span></div>;
}
