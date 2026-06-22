"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { fmtHM, ResolvedSlot, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Clock4, Scissors, UserCog, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Staff { id: string; first_name: string; last_name: string; role: string }
type Op = { kind: "override" | "overtime" | "partial"; slot: ResolvedSlot } | { kind: "swap" } | null;

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function ShiftOverridesPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(ymd(new Date()));
  const [op, setOp] = useState<Op>(null);

  const { data: slots = [], isLoading } = useQuery<ResolvedSlot[]>({
    queryKey: ["resolved-range", date, date],
    queryFn: () => shiftsApi.resolvedRange({ from: date, to: date }),
  });

  const assignedSlots = slots.filter((s) => s.assignment);

  function refresh() { qc.invalidateQueries({ queryKey: ["resolved-range"] }); setOp(null); }

  return (
    <>
      <PageHeader
        title="Smena almashtirish"
        subtitle="Almashtirish, o'tkazish, qisman o'tkazish, qo'shimcha ish vaqti va 1-kunlik override"
        actions={
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
            <button onClick={() => setOp({ kind: "swap" })} disabled={assignedSlots.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
              <ArrowLeftRight className="w-4 h-4" /> Smena almashtirish
            </button>
          </div>
        }
      />

      <PageContent>
        <div className="flex gap-2 text-xs text-text-muted">
          <Legend color="bg-background border-border" label="Standart" />
          <Legend color="bg-indigo-50 border-indigo-200" label="Override" />
          <Legend color="bg-amber-50 border-amber-200" label="Bo'sh" />
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-12"><Clock4 className="w-8 h-8 mx-auto opacity-30 animate-spin" /></div>
        ) : slots.length === 0 ? (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">Bu kunda smena yo'q</div>
        ) : (
          <div className="border border-border rounded-xl bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="p-3 font-medium">Smena</th>
                  <th className="p-3 font-medium">Xona</th>
                  <th className="p-3 font-medium">Vaqt</th>
                  <th className="p-3 font-medium">Shifokor</th>
                  <th className="p-3 font-medium">Holat</th>
                  <th className="p-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="p-3 text-text font-medium">{s.shift.name}</td>
                    <td className="p-3 text-text">{s.room.name}</td>
                    <td className="p-3 text-text-muted">{fmtHM(s.shift.startHour)}–{fmtHM(s.shift.endHour)}</td>
                    <td className="p-3 text-text">{s.doctor ? `${s.doctor.first_name} ${s.doctor.last_name}` : <span className="text-amber-600">biriktirilmagan</span>}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        s.source === "assigned" ? "bg-success-50 text-success border-success-100"
                        : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {s.source === "assigned" ? "Tayinlangan" : "Bo'sh"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <IconBtn title="1-kunlik override" onClick={() => setOp({ kind: "override", slot: s })}><UserCog className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Qisman o'tkazish" disabled={!s.assignment} onClick={() => setOp({ kind: "partial", slot: s })}><Scissors className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Qo'shimcha ish vaqti" disabled={!s.assignment} onClick={() => setOp({ kind: "overtime", slot: s })}><Clock4 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-text-muted">Qisman o'tkazish va qo'shimcha ish vaqti faqat tayinlangan (override yoki materializatsiya qilingan) smenalarda mavjud.</p>
      </PageContent>

      {op?.kind === "override" && <OverrideModal slot={op.slot} onClose={() => setOp(null)} onSaved={refresh} />}
      {op?.kind === "overtime" && <OvertimeModal slot={op.slot} onClose={() => setOp(null)} onSaved={refresh} />}
      {op?.kind === "partial" && <PartialModal slot={op.slot} onClose={() => setOp(null)} onSaved={refresh} />}
      {op?.kind === "swap" && <SwapModal slots={assignedSlots} onClose={() => setOp(null)} onSaved={refresh} />}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded border ${color}`} />{label}</span>;
}
function IconBtn({ children, title, onClick, disabled }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return <button title={title} onClick={onClick} disabled={disabled} className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed">{children}</button>;
}
function useDoctors() {
  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["staff-list"], queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data) });
  return staff.filter((s) => s.role === "DOCTOR");
}
function ModalShell({ title, icon, children, onClose }: { title: string; icon: React.ReactNode; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-[460px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text flex items-center gap-2">{icon}{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OverrideModal({ slot, onClose, onSaved }: { slot: ResolvedSlot; onClose: () => void; onSaved: () => void }) {
  const doctors = useDoctors();
  const [doctorId, setDoctorId] = useState(slot.doctor?.id ?? "");
  const save = useMutation({
    mutationFn: () => shiftsApi.createOverride({ roomShiftId: slot.shift.id, roomId: slot.room.id, date: slot.date.slice(0, 10), doctorId }),
    onSuccess: () => { toast.success("Override saqlandi"); onSaved(); }, onError: () => toast.error("Xatolik"),
  });
  return (
    <ModalShell title="1-kunlik override" icon={<UserCog className="w-5 h-5 text-primary" />} onClose={onClose}>
      <p className="text-sm text-text-muted mb-3">{slot.shift.name} · {slot.room.name} · {slot.date.slice(0, 10)}</p>
      <label className="text-xs text-text-muted block mb-1">Yangi shifokor</label>
      <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
        <option value="">— Tanlang —</option>
        {doctors.map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
      </select>
      <SaveRow onClose={onClose} onSave={() => save.mutate()} disabled={!doctorId} pending={save.isPending} />
    </ModalShell>
  );
}

function OvertimeModal({ slot, onClose, onSaved }: { slot: ResolvedSlot; onClose: () => void; onSaved: () => void }) {
  const [newEndHour, setNewEndHour] = useState(slot.shift.endHour + 2);
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: () => shiftsApi.overtime({ assignmentId: slot.assignment!.id, newEndHour, reason: reason || undefined }),
    onSuccess: () => { toast.success("Qo'shimcha vaqt qo'shildi"); onSaved(); }, onError: () => toast.error("Xatolik"),
  });
  return (
    <ModalShell title="Qo'shimcha ish vaqti" icon={<Clock4 className="w-5 h-5 text-purple-600" />} onClose={onClose}>
      <p className="text-sm text-text-muted mb-3">{slot.doctor?.first_name} {slot.doctor?.last_name} · {slot.shift.name}</p>
      <label className="text-xs text-text-muted block mb-1">Yangi tugash soati (mavjud: {slot.shift.endHour})</label>
      <input type="number" min={slot.shift.endHour + 1} max={48} value={newEndHour} onChange={(e) => setNewEndHour(+e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text mb-3" />
      <label className="text-xs text-text-muted block mb-1">Sabab</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
      <SaveRow onClose={onClose} onSave={() => save.mutate()} disabled={newEndHour <= slot.shift.endHour} pending={save.isPending} />
    </ModalShell>
  );
}

function PartialModal({ slot, onClose, onSaved }: { slot: ResolvedSlot; onClose: () => void; onSaved: () => void }) {
  const doctors = useDoctors();
  const [toDoctorId, setToDoctorId] = useState("");
  const [windowStart, setWindowStart] = useState(slot.shift.startHour);
  const [windowEnd, setWindowEnd] = useState(slot.shift.endHour);
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: () => shiftsApi.partialTransfer({ assignmentId: slot.assignment!.id, toDoctorId, windowStart, windowEnd, reason: reason || undefined }),
    onSuccess: () => { toast.success("Qisman o'tkazildi"); onSaved(); }, onError: () => toast.error("Xatolik"),
  });
  return (
    <ModalShell title="Qisman o'tkazish" icon={<Scissors className="w-5 h-5 text-indigo-600" />} onClose={onClose}>
      <p className="text-sm text-text-muted mb-3">{slot.doctor?.first_name} {slot.doctor?.last_name} dan boshqa shifokorga</p>
      <label className="text-xs text-text-muted block mb-1">Qabul qiluvchi shifokor</label>
      <select value={toDoctorId} onChange={(e) => setToDoctorId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text mb-3">
        <option value="">— Tanlang —</option>
        {doctors.filter((d) => d.id !== slot.doctor?.id).map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="text-xs text-text-muted block mb-1">Dan (soat)</label>
          <input type="number" min={0} max={23} value={windowStart} onChange={(e) => setWindowStart(+e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" /></div>
        <div><label className="text-xs text-text-muted block mb-1">Gacha (soat)</label>
          <input type="number" min={1} max={24} value={windowEnd} onChange={(e) => setWindowEnd(+e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" /></div>
      </div>
      <label className="text-xs text-text-muted block mb-1">Sabab</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
      <SaveRow onClose={onClose} onSave={() => save.mutate()} disabled={!toDoctorId || windowStart >= windowEnd} pending={save.isPending} />
    </ModalShell>
  );
}

function SwapModal({ slots, onClose, onSaved }: { slots: ResolvedSlot[]; onClose: () => void; onSaved: () => void }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: () => shiftsApi.swap({ fromAssignmentId: a, toAssignmentId: b, reason: reason || undefined }),
    onSuccess: () => { toast.success("Smenalar almashtirildi"); onSaved(); }, onError: () => toast.error("Xatolik"),
  });
  const label = (s: ResolvedSlot) => `${s.shift.name} · ${s.room.name} · ${s.doctor?.first_name} ${s.doctor?.last_name}`;
  return (
    <ModalShell title="Smena almashtirish" icon={<ArrowLeftRight className="w-5 h-5 text-primary" />} onClose={onClose}>
      <label className="text-xs text-text-muted block mb-1">Birinchi smena</label>
      <select value={a} onChange={(e) => setA(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text mb-3">
        <option value="">— Tanlang —</option>
        {slots.map((s) => <option key={s.assignment!.id} value={s.assignment!.id}>{label(s)}</option>)}
      </select>
      <label className="text-xs text-text-muted block mb-1">Ikkinchi smena</label>
      <select value={b} onChange={(e) => setB(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text mb-3">
        <option value="">— Tanlang —</option>
        {slots.filter((s) => s.assignment!.id !== a).map((s) => <option key={s.assignment!.id} value={s.assignment!.id}>{label(s)}</option>)}
      </select>
      <label className="text-xs text-text-muted block mb-1">Sabab</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
      <SaveRow onClose={onClose} onSave={() => save.mutate()} disabled={!a || !b || a === b} pending={save.isPending} label="Almashtirish" />
    </ModalShell>
  );
}

function SaveRow({ onClose, onSave, disabled, pending, label = "Saqlash" }: { onClose: () => void; onSave: () => void; disabled?: boolean; pending?: boolean; label?: string }) {
  return (
    <div className="flex gap-2 justify-end mt-6">
      <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">Bekor</button>
      <button onClick={onSave} disabled={disabled || pending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">{pending ? "..." : label}</button>
    </div>
  );
}
