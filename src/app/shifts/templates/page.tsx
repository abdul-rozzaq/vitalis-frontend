"use client";
import { useTranslations } from "next-intl";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DEFAULT_SHIFT_COLORS } from "@/components/shifts/ShiftTimeline";
import { AssignDoctorModal } from "@/components/shifts/AssignDoctorModal";
import { api } from "@/lib/api";
import { fmtHM, RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Edit2, LayoutTemplate, Plus, Trash2, UserPlus, X } from "lucide-react";
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

const EMPTY_FORM = {
  name: "",
  startTime: "08:00",
  endTime: "20:00",
  color: DEFAULT_SHIFT_COLORS[0],
  hasRound: false,
  roundHour: "" as number | "",
  nurseIds: [] as string[],
  roomIds: [] as string[],
};
type FormState = typeof EMPTY_FORM;

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":").map(Number);
  return { hour: h, minute: m || 0 };
}

export default function ShiftTemplatesPage() {
  const t = useTranslations();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState<"new" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<RoomShift | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [assignTarget, setAssignTarget] = useState<RoomShift | null>(null);

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms-all"],
    queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data),
  });
  const wardRooms = rooms.filter((r) => r.roomType === "WARD");

  const { data: shifts = [], isLoading } = useQuery<RoomShift[]>({
    queryKey: ["room-shifts"],
    queryFn: () => shiftsApi.listTemplates(),
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff-list"],
    queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data),
  });
  const nurses = staff.filter((s) => s.role === "HAMSHIRA");

  function buildPayload(data: FormState) {
    const start = parseTime(data.startTime);
    const end = parseTime(data.endTime);
    return {
      name: data.name,
      startHour: start.hour,
      startMinute: start.minute,
      endHour: end.hour === 0 ? 24 : end.hour,
      endMinute: end.minute,
      color: data.color,
      roundHour: data.hasRound && data.roundHour !== "" ? data.roundHour : null,
      nurseIds: data.nurseIds,
      roomIds: data.roomIds,
    };
  }

  const createMutation = useMutation({
    mutationFn: (data: FormState) => shiftsApi.createTemplate(buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); closeModal(); toast.success("Shablon yaratildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) => shiftsApi.updateTemplate(id, buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); closeModal(); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftsApi.deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["room-shifts"] }); toast.success("O'chirildi"); },
    onError: () => toast.error("Xatolik"),
  });

  function openNew() { setForm({ ...EMPTY_FORM }); setShowModal("new"); }

  function openEdit(shift: RoomShift) {
    setEditTarget(shift);
    setForm({
      name: shift.name,
      startTime: fmtHM(shift.startHour, shift.startMinute),
      endTime: fmtHM(shift.endHour, shift.endMinute),
      color: shift.color ?? DEFAULT_SHIFT_COLORS[0],
      hasRound: shift.roundHour != null,
      roundHour: shift.roundHour ?? "",
      nurseIds: shift.defaultNurses.map((n) => n.nurseId),
      roomIds: shift.rooms.map((r) => r.roomId),
    });
    setShowModal("edit");
  }

  function closeModal() { setShowModal(null); setEditTarget(null); }
  function toggleRoom(id: string) { setForm((p) => ({ ...p, roomIds: p.roomIds.includes(id) ? p.roomIds.filter((x) => x !== id) : [...p.roomIds, id] })); }
  function toggleNurse(id: string) { setForm((p) => ({ ...p, nurseIds: p.nurseIds.includes(id) ? p.nurseIds.filter((x) => x !== id) : [...p.nurseIds, id] })); }

  function handleSave() {
    if (showModal === "new") createMutation.mutate(form);
    else if (showModal === "edit" && editTarget) updateMutation.mutate({ id: editTarget.id, data: form });
  }

  return (
    <>
      <PageHeader
        title={t("shifts.templatesTitle")}
        subtitle={t("shifts.templatesSubtitle")}
        actions={
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Yangi shablon
          </button>
        }
      />

      <PageContent>
        {isLoading ? (
          <div className="text-center text-text-muted py-12"><Clock className="w-8 h-8 mx-auto mb-2 opacity-30 animate-spin" /></div>
        ) : shifts.length === 0 ? (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Shablon yo'q</p>
            <p className="text-sm mt-1">"Yangi shablon" tugmasini bosing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shifts.map((shift) => (
              <TemplateCard key={shift.id} shift={shift}
                onEdit={() => openEdit(shift)}
                onAssign={() => setAssignTarget(shift)}
                onDelete={() => { if (confirm(`"${shift.name}" shablonini o'chirasizmi?`)) deleteMutation.mutate(shift.id); }} />
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="bg-surface border border-border rounded-2xl p-6 w-[520px] shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-text">{showModal === "new" ? "Yangi shablon" : "Shablonni tahrirlash"}</h3>
                <button onClick={closeModal} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Nom *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Masalan: Ertalgi smena" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Boshlanish vaqti</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Tugash vaqti</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-3 bg-background">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hasRound} onChange={(e) => setForm((p) => ({ ...p, hasRound: e.target.checked, roundHour: e.target.checked ? (p.roundHour === "" ? 8 : p.roundHour) : "" }))} className="rounded accent-primary" />
                    <span className="text-sm text-text font-medium">Bu smenada apoxot bo'ladi</span>
                  </label>
                  {form.hasRound && (
                    <div className="mt-3">
                      <label className="text-xs text-text-muted block mb-1">Apoxot vaqti (soat)</label>
                      <input type="number" min={0} max={23} value={form.roundHour} onChange={(e) => setForm((p) => ({ ...p, roundHour: e.target.value ? +e.target.value : "" }))} className="w-32 border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-text-muted block mb-1">Rang</label>
                  <div className="flex gap-1.5 mt-1.5">
                    {DEFAULT_SHIFT_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? "border-text scale-125" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted block mb-2">Standart hamshiralar ({form.nurseIds.length})</label>
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

                <div>
                  <label className="text-xs text-text-muted block mb-2">Xonalar ({form.roomIds.length})</label>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                    {wardRooms.length === 0 && <p className="text-xs text-text-muted col-span-2 py-1 text-center">Palata xonalar yo'q</p>}
                    {wardRooms.map((r) => (
                      <label key={r.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${form.roomIds.includes(r.id) ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text"}`}>
                        <input type="checkbox" checked={form.roomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} className="rounded accent-primary" />
                        <span className="truncate">{r.name}</span>
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

      {assignTarget && (
        <AssignDoctorModal
          shift={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["resolved-range"] }); setAssignTarget(null); }}
        />
      )}
    </>
  );
}

function TemplateCard({ shift, onEdit, onAssign, onDelete }: { shift: RoomShift; onEdit: () => void; onAssign: () => void; onDelete: () => void }) {
  const color = shift.color ?? DEFAULT_SHIFT_COLORS[0];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-text text-sm">{shift.name}</h3>
          <span className="text-xs text-text-muted bg-background border border-border px-2 py-0.5 rounded-full">
            {fmtHM(shift.startHour, shift.startMinute)} – {fmtHM(shift.endHour, shift.endMinute)}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAssign} className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10" title={t("shifts.assignDoctorBtn")}><UserPlus className="w-4 h-4" /></button>
          <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"><Edit2 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-danger-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-text-muted">
        {shift.roundHour != null && (
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Apoxot {fmtHM(shift.roundHour)}</span>
        )}
        {shift.defaultNurses.length > 0 && <span>👩‍⚕️ <span className="text-text">{shift.defaultNurses.length} hamshira</span></span>}
        {shift.rooms.length > 0 && <span>🚪 <span className="text-text">{shift.rooms.length} xona</span></span>}
      </div>
    </div>
  );
}
