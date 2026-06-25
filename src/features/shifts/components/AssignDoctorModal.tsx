"use client";
import { useTranslations } from "next-intl";

import { api } from "@/shared/lib/api";
import { fmtHM, RoomShift, shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Staff { id: string; first_name: string; last_name: string; role: string }

const DOW = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function startOfWeek(d: Date) { const x = new Date(d); const day = (x.getUTCDay() + 6) % 7; return addDays(x, -day); }

export function AssignDoctorModal({ shift, onClose, onSaved }: { shift: RoomShift; onClose: () => void; onSaved: () => void }) {
  const today = ymd(new Date());
  const [anchor, setAnchor] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
  const [roomId, setRoomId] = useState(shift.rooms[0]?.roomId ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff-list"],
    queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data),
  });
  const doctors = staff.filter((s) => s.role === "DOCTOR");

  const cells = useMemo(() => {
    const first = new Date(anchor);
    const gridStart = startOfWeek(first);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) out.push(addDays(gridStart, i));
    return out;
  }, [anchor]);

  function prevMonth() { setAnchor((a) => new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() - 1, 1))); }
  function nextMonth() { setAnchor((a) => new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 1))); }

  function toggleDay(d: Date) {
    const key = ymd(d);
    if (key < today) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const save = useMutation({
    mutationFn: () => shiftsApi.bulkAssign({ roomShiftId: shift.id, roomId, doctorId, dates: [...selected] }),
    onSuccess: () => { toast.success(`${selected.size} kunga tayinlandi`); onSaved(); },
    onError: () => toast.error("Xatolik"),
  });

  const canSave = roomId && doctorId && selected.size > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-[480px] shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-text">Shifokor tayinlash</h3>
            <p className="text-xs text-text-muted mt-0.5">{shift.name} · {fmtHM(shift.startHour, shift.startMinute)}–{fmtHM(shift.endHour, shift.endMinute)}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 mb-4">
          {shift.rooms.length > 1 && (
            <div>
              <label className="text-xs text-text-muted block mb-1">Xona</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
                {shift.rooms.map((r) => <option key={r.roomId} value={r.roomId}>{r.room.name}</option>)}
              </select>
            </div>
          )}
          {shift.rooms.length === 1 && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Xona:</span><span className="font-medium text-text">{shift.rooms[0].room.name}</span>
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted block mb-1">Shifokor</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
              <option value="">— Tanlang —</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>
        </div>

        {/* Calendar */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border">
            <button onClick={prevMonth} className="p-1 hover:bg-surface-hover rounded text-text-muted"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium text-text">{MONTHS[anchor.getUTCMonth()]} {anchor.getUTCFullYear()}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-surface-hover rounded text-text-muted"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {DOW.map((d) => <div key={d} className="py-1.5 text-center text-[11px] font-medium text-text-muted">{d}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((d) => {
              const key = ymd(d);
              const inMonth = d.getUTCMonth() === anchor.getUTCMonth();
              const isPast = key < today;
              const isToday = key === today;
              const isSel = selected.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleDay(d)}
                  disabled={isPast}
                  className={`h-9 text-xs border-r border-b border-border last:border-r-0 transition-colors
                    ${isPast ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                    ${isSel ? "bg-primary text-white font-medium" : isToday ? "bg-primary/10 text-primary font-medium" : inMonth ? "hover:bg-surface-hover text-text" : "text-text-muted hover:bg-surface-hover"}`}
                >
                  {d.getUTCDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-muted">{selected.size > 0 ? `${selected.size} kun tanlandi` : "Kunlarni tanlang"}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">Bekor</button>
            <button
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? "Saqlanmoqda..." : "Tayinlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
