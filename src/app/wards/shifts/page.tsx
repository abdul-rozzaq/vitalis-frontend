"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DEFAULT_SHIFT_COLORS, ShiftBlock, ShiftTimeline } from "@/components/shifts/ShiftTimeline";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Room {
  id: string;
  name: string;
  roomType: string;
  department?: { name: string } | null;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface RoomShift {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  startDate: string | null;
  endDate: string | null;
  color: string | null;
  roundHour: number | null;
  doctorId: string | null;
  doctor: { id: string; first_name: string; last_name: string } | null;
  defaultNurses: { id: string; nurseId: string; nurse: { id: string; first_name: string; last_name: string } }[];
  rooms: { id: string; roomId: string; room: { id: string; name: string } }[];
}

const EMPTY_FORM = {
  name: "",
  startHour: 8,
  endHour: 20,
  startDate: "",
  endDate: "",
  color: DEFAULT_SHIFT_COLORS[0],
  hasRound: false,
  roundHour: "" as number | "",
  doctorId: "",
  nurseIds: [] as string[],
  roomIds: [] as string[],
};

export default function ShiftsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState<"new" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<RoomShift | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms-all"],
    queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data),
  });

  const wardRooms = rooms.filter((r) => r.roomType === "WARD");

  const { data: shifts = [], isLoading } = useQuery<RoomShift[]>({
    queryKey: ["room-shifts"],
    queryFn: () => api.get("/room-shifts").then((r) => r.data),
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff-list"],
    queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data),
  });

  const doctors = staff.filter((s) => s.role === "DOCTOR");
  const nurses = staff.filter((s) => s.role === "HAMSHIRA");

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const { hasRound, roundHour, doctorId, startDate, endDate, ...rest } = data;
      return api.post("/room-shifts", {
        ...rest,
        roundHour: hasRound && roundHour !== "" ? roundHour : undefined,
        doctorId: doctorId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); closeModal(); toast.success("Smena yaratildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => {
      const { hasRound, roundHour, doctorId, startDate, endDate, ...rest } = data;
      return api.patch(`/room-shifts/${id}`, {
        ...rest,
        roundHour: hasRound && roundHour !== "" ? roundHour : null,
        doctorId: doctorId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); closeModal(); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik"),
  });

  const updateTimeMutation = useMutation({
    mutationFn: ({ id, startHour, endHour }: { id: string; startHour: number; endHour: number }) =>
      api.patch(`/room-shifts/${id}`, { startHour, endHour }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-shifts"] }),
    onError: () => toast.error("Vaqtni yangilashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/room-shifts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); toast.success("O'chirildi"); },
    onError: () => toast.error("Xatolik"),
  });

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setShowModal("new");
  }

  function openEdit(shift: RoomShift) {
    setEditTarget(shift);
    setForm({
      name: shift.name,
      startHour: shift.startHour,
      endHour: shift.endHour,
      startDate: shift.startDate ? shift.startDate.slice(0, 10) : "",
      endDate: shift.endDate ? shift.endDate.slice(0, 10) : "",
      color: shift.color ?? DEFAULT_SHIFT_COLORS[0],
      hasRound: shift.roundHour != null,
      roundHour: shift.roundHour ?? "",
      doctorId: shift.doctorId ?? "",
      nurseIds: shift.defaultNurses.map((n) => n.nurseId),
      roomIds: shift.rooms.map((r) => r.roomId),
    });
    setShowModal("edit");
  }

  function closeModal() { setShowModal(null); setEditTarget(null); }

  function toggleRoom(id: string) {
    setForm((p) => ({ ...p, roomIds: p.roomIds.includes(id) ? p.roomIds.filter((x) => x !== id) : [...p.roomIds, id] }));
  }

  function toggleNurse(id: string) {
    setForm((p) => ({ ...p, nurseIds: p.nurseIds.includes(id) ? p.nurseIds.filter((x) => x !== id) : [...p.nurseIds, id] }));
  }

  function handleSave() {
    if (showModal === "new") createMutation.mutate(form);
    else if (showModal === "edit" && editTarget) updateMutation.mutate({ id: editTarget.id, data: form });
  }

  const timelineBlocks: ShiftBlock[] = shifts.map((s) => ({
    id: s.id,
    name: s.name,
    startHour: s.startHour,
    endHour: s.endHour,
    color: s.color,
  }));

  return (
    <>
      <PageHeader
        title="Smenalar boshqaruvi"
        subtitle="Smena shablonlari va xodimlar biriktiruvi"
        actions={
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Yangi smena
          </button>
        }
      />

      <PageContent>
        {/* Timeline — one row per shift */}
        {shifts.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5 mb-6">
            <h3 className="font-medium text-text mb-4">Kunlik jadval</h3>
            <ShiftTimeline
              shifts={timelineBlocks}
              onShiftClick={(s) => { const full = shifts.find((f) => f.id === s.id); if (full) openEdit(full); }}
              onShiftUpdate={(id, startHour, endHour) => updateTimeMutation.mutate({ id, startHour, endHour })}
            />
            <p className="text-xs text-text-muted mt-3">Bloklarni drag qilib vaqtini o'zgartiring. Yangi smena qo'shish uchun yuqoridagi "Yangi smena" tugmasidan foydalaning.</p>
          </div>
        )}

        {/* Shift cards */}
        {isLoading ? (
          <div className="text-center text-text-muted py-12"><Clock className="w-8 h-8 mx-auto mb-2 opacity-30 animate-spin" /></div>
        ) : shifts.length === 0 ? (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Smena yo'q</p>
            <p className="text-sm mt-1">"Yangi smena" tugmasini bosing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onEdit={() => openEdit(shift)}
                onDelete={() => { if (confirm(`"${shift.name}" smenasini o'chirasizmi?`)) deleteMutation.mutate(shift.id); }}
              />
            ))}
          </div>
        )}

        {/* Create / Edit modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="bg-surface border border-border rounded-2xl p-6 w-[520px] shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-text">{showModal === "new" ? "Yangi smena" : "Smenani tahrirlash"}</h3>
                <button onClick={closeModal} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs text-text-muted block mb-1">Nom *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Masalan: Kungi navbat" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                </div>

                {/* Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Boshlanish soati</label>
                    <input type="number" min={0} max={23} value={form.startHour} onChange={(e) => setForm((p) => ({ ...p, startHour: +e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Tugash soati (24 = 00:00)</label>
                    <input type="number" min={1} max={24} value={form.endHour} onChange={(e) => setForm((p) => ({ ...p, endHour: +e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                </div>

                {/* Validity dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Boshlash sanasi</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Tugash sanasi</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                </div>

                {/* Ko'rik (apoxot) — checkbox bilan yoqiladi */}
                <div className="border border-border rounded-lg p-3 bg-background">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasRound}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        hasRound: e.target.checked,
                        roundHour: e.target.checked ? (p.roundHour === "" ? 8 : p.roundHour) : "",
                      }))}
                      className="rounded accent-primary"
                    />
                    <span className="text-sm text-text font-medium">Bu smenada ko'rik (apoxot) bo'ladi</span>
                  </label>
                  {form.hasRound && (
                    <div className="mt-3">
                      <label className="text-xs text-text-muted block mb-1">Ko'rik vaqti (soat)</label>
                      <input type="number" min={0} max={23} value={form.roundHour} onChange={(e) => setForm((p) => ({ ...p, roundHour: e.target.value ? +e.target.value : "" }))} className="w-32 border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text" />
                    </div>
                  )}
                </div>

                {/* Rang */}
                <div>
                  <label className="text-xs text-text-muted block mb-1">Rang</label>
                  <div className="flex gap-1.5 mt-1.5">
                    {DEFAULT_SHIFT_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? "border-text scale-125" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                {/* Doctor */}
                <div>
                  <label className="text-xs text-text-muted block mb-1">Shifokor</label>
                  <select value={form.doctorId} onChange={(e) => setForm((p) => ({ ...p, doctorId: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
                    <option value="">— Tanlang —</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>

                {/* Nurses */}
                <div>
                  <label className="text-xs text-text-muted block mb-2">Hamshiralar ({form.nurseIds.length} ta tanlangan)</label>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                    {nurses.length === 0 && <p className="text-xs text-text-muted col-span-2 py-1 text-center">Hamshira yo'q</p>}
                    {nurses.map((n) => (
                      <label key={n.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${form.nurseIds.includes(n.id) ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text"}`}>
                        <input type="checkbox" checked={form.nurseIds.includes(n.id)} onChange={() => toggleNurse(n.id)} className="rounded accent-primary" />
                        <span className="truncate">{n.first_name} {n.last_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rooms */}
                <div>
                  <label className="text-xs text-text-muted block mb-2">Xonalar ({form.roomIds.length} ta tanlangan)</label>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                    {wardRooms.length === 0 && <p className="text-xs text-text-muted col-span-2 py-1 text-center">Palata xonalar yo'q</p>}
                    {wardRooms.map((r) => (
                      <label key={r.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${form.roomIds.includes(r.id) ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text"}`}>
                        <input type="checkbox" checked={form.roomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} className="rounded accent-primary" />
                        <span className="truncate">{r.name}</span>
                        {r.department && <span className="text-[10px] text-text-muted">({r.department.name})</span>}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-5">
                <button onClick={closeModal} className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">Bekor</button>
                <button onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}

function ShiftCard({ shift, onEdit, onDelete }: {
  shift: RoomShift;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = shift.color ?? DEFAULT_SHIFT_COLORS[0];

  function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-text text-sm">{shift.name}</h3>
          <span className="text-xs text-text-muted bg-background border border-border px-2 py-0.5 rounded-full">
            {String(shift.startHour).padStart(2, "0")}:00 – {String(shift.endHour === 24 ? 0 : shift.endHour).padStart(2, "0")}:00
          </span>
          {shift.roundHour != null && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Apoxot {String(shift.roundHour).padStart(2, "0")}:00
            </span>
          )}
          {(shift.startDate || shift.endDate) && (
            <span className="text-xs text-text-muted">
              {fmtDate(shift.startDate) ?? "…"} → {fmtDate(shift.endDate) ?? "…"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"><Edit2 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
        {/* Doctor */}
        <span>
          👨‍⚕️{" "}
          {shift.doctor
            ? <span className="text-text font-medium">{shift.doctor.first_name} {shift.doctor.last_name}</span>
            : <span className="italic">Shifokor biriktirilmagan</span>}
        </span>

        {/* Nurses */}
        {shift.defaultNurses.length > 0 && (
          <span>
            👩‍⚕️{" "}
            <span className="text-text">{shift.defaultNurses.map((n) => `${n.nurse.first_name} ${n.nurse.last_name}`).join(", ")}</span>
          </span>
        )}
      </div>

      {/* Rooms */}
      {shift.rooms.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {shift.rooms.map((sr) => (
            <span key={sr.id} className="text-xs bg-surface-hover border border-border px-2 py-0.5 rounded-full text-text">{sr.room.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
