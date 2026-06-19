"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Edit2, Layers, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Room {
  id: string;
  name: string;
  roomNumber: string | null;
  floor: number | null;
  capacity: number | null;
  roomType: string;
  department?: { id: string; name: string } | null;
}
interface Ward { roomId?: string; room?: { id: string }; status: string }

export default function RoomListPage() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Room | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>("");

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["rooms-all"], queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data),
  });
  const { data: shifts = [] } = useQuery<RoomShift[]>({ queryKey: ["room-shifts"], queryFn: () => shiftsApi.listTemplates() });
  const { data: wards = [] } = useQuery<Ward[]>({ queryKey: ["wards-all"], queryFn: () => api.get("/wards").then((r) => r.data.data ?? r.data) });

  // occupancy per room
  const occupancy = useMemo(() => {
    const map = new Map<string, number>();
    wards.forEach((w) => {
      const rid = w.roomId ?? w.room?.id;
      if (rid && w.status === "OCCUPIED") map.set(rid, (map.get(rid) ?? 0) + 1);
    });
    return map;
  }, [wards]);

  // staff per room from shift templates
  const staffByRoom = useMemo(() => {
    const map = new Map<string, { doctors: Set<string>; nurses: Set<string> }>();
    shifts.forEach((sh) => {
      sh.rooms.forEach((sr) => {
        const cur = map.get(sr.roomId) ?? { doctors: new Set(), nurses: new Set() };
        if (sh.doctor) cur.doctors.add(`${sh.doctor.first_name} ${sh.doctor.last_name}`);
        sh.defaultNurses.forEach((n) => cur.nurses.add(`${n.nurse.first_name} ${n.nurse.last_name}`));
        map.set(sr.roomId, cur);
      });
    });
    return map;
  }, [shifts]);

  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor).filter((f): f is number => f != null))].sort((a, b) => a - b), [rooms]);
  const filtered = floorFilter ? rooms.filter((r) => String(r.floor) === floorFilter) : rooms;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) => api.patch(`/rooms/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms-all"] }); setEdit(null); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik"),
  });

  return (
    <>
      <PageHeader title="Xonalar" subtitle="Qavat, sig'im, bandlik va biriktirilgan xodimlar"
        actions={
          <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
            <option value="">Barcha qavatlar</option>
            {floors.map((f) => <option key={f} value={f}>{f}-qavat</option>)}
          </select>
        } />

      <PageContent>
        {isLoading ? (
          <div className="text-center text-text-muted py-12"><DoorOpen className="w-8 h-8 mx-auto opacity-30 animate-pulse" /></div>
        ) : (
          <div className="border border-border rounded-xl bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="p-3 font-medium">Raqam</th>
                  <th className="p-3 font-medium">Nom</th>
                  <th className="p-3 font-medium">Qavat</th>
                  <th className="p-3 font-medium">Bo'lim</th>
                  <th className="p-3 font-medium">Bandlik</th>
                  <th className="p-3 font-medium">Shifokor(lar)</th>
                  <th className="p-3 font-medium">Hamshira(lar)</th>
                  <th className="p-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const occ = occupancy.get(r.id) ?? 0;
                  const cap = r.capacity ?? 0;
                  const staff = staffByRoom.get(r.id);
                  const pct = cap ? (occ / cap) * 100 : 0;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="p-3 text-text font-medium">{r.roomNumber ?? "—"}</td>
                      <td className="p-3 text-text">{r.name}</td>
                      <td className="p-3 text-text-muted">{r.floor != null ? `${r.floor}-qavat` : "—"}</td>
                      <td className="p-3 text-text-muted">{r.department?.name ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className={`h-full ${pct >= 100 ? "bg-danger-500" : pct >= 70 ? "bg-amber-500" : "bg-success"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs text-text-muted">{occ}/{cap}</span>
                        </div>
                      </td>
                      <td className="p-3 text-text-muted">{staff && staff.doctors.size > 0 ? [...staff.doctors].join(", ") : "—"}</td>
                      <td className="p-3 text-text-muted">{staff && staff.nurses.size > 0 ? `${staff.nurses.size} ta` : "—"}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setEdit(r)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"><Edit2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageContent>

      {edit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-text flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />{edit.name}</h3>
              <button onClick={() => setEdit(null)} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            <RoomEditForm room={edit} onSave={(data) => updateMutation.mutate({ id: edit.id, data })} pending={updateMutation.isPending} />
          </div>
        </div>
      )}
    </>
  );
}

function RoomEditForm({ room, onSave, pending }: { room: Room; onSave: (d: Partial<Room>) => void; pending: boolean }) {
  const [roomNumber, setRoomNumber] = useState(room.roomNumber ?? "");
  const [floor, setFloor] = useState<string>(room.floor != null ? String(room.floor) : "");
  const [capacity, setCapacity] = useState<string>(room.capacity != null ? String(room.capacity) : "");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-text-muted block mb-1">Xona raqami</label>
          <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" /></div>
        <div><label className="text-xs text-text-muted block mb-1">Qavat</label>
          <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" /></div>
      </div>
      <div><label className="text-xs text-text-muted block mb-1">Sig'im</label>
        <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" /></div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={() => onSave({
          roomNumber: roomNumber || null,
          floor: floor === "" ? null : Number(floor),
          capacity: capacity === "" ? undefined : Number(capacity),
        })} disabled={pending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">{pending ? "..." : "Saqlash"}</button>
      </div>
    </div>
  );
}
