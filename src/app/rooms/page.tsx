"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, DoorOpen, Edit2, Layers, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Room {
  id: string;
  name: string;
  floor: number | null;
  capacity: number | null;
  roomType: string;
  department?: { id: string; name: string } | null;
}
interface Ward { roomId?: string; room?: { id: string }; status: string }

export default function RoomsPage() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Room | null>(null);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["rooms-all"],
    queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data),
  });
  const { data: shifts = [] } = useQuery<RoomShift[]>({
    queryKey: ["room-shifts"],
    queryFn: () => shiftsApi.listTemplates(),
  });
  const { data: wards = [] } = useQuery<Ward[]>({
    queryKey: ["wards-all"],
    queryFn: () => api.get("/wards").then((r) => r.data.data ?? r.data),
  });

  const occupancy = useMemo(() => {
    const map = new Map<string, number>();
    wards.forEach((w) => {
      const rid = w.roomId ?? w.room?.id;
      if (rid && w.status === "OCCUPIED") map.set(rid, (map.get(rid) ?? 0) + 1);
    });
    return map;
  }, [wards]);

  const nursesByRoom = useMemo(() => {
    const map = new Map<string, Set<string>>();
    shifts.forEach((sh) => {
      sh.rooms.forEach((sr) => {
        const cur = map.get(sr.roomId) ?? new Set<string>();
        sh.defaultNurses.forEach((n) => cur.add(`${n.nurse.first_name} ${n.nurse.last_name}`));
        map.set(sr.roomId, cur);
      });
    });
    return map;
  }, [shifts]);

  const byFloor = useMemo(() => {
    const map = new Map<number | "none", Room[]>();
    rooms.forEach((r) => {
      const k = r.floor ?? "none";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    });
    return [...map.entries()].sort((a, b) =>
      a[0] === "none" ? 1 : b[0] === "none" ? -1 : (a[0] as number) - (b[0] as number)
    );
  }, [rooms]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) => api.patch(`/rooms/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms-all"] }); setEdit(null); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik"),
  });

  return (
    <>
      <PageHeader title="Xonalar" subtitle="Binoning qavatlar bo'yicha vizual ko'rinishi" />

      <PageContent>
        <div className="flex gap-3 text-xs text-text-muted">
          <Legend cls="bg-success" label="Bo'sh" />
          <Legend cls="bg-amber-500" label="Qisman" />
          <Legend cls="bg-danger-500" label="To'la" />
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-12">
            <Building className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
          </div>
        ) : byFloor.map(([floor, floorRooms]) => (
          <div key={String(floor)} className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-text">
                {floor === "none" ? "Qavat belgilanmagan" : `${floor}-qavat`}
              </h3>
              <span className="text-xs text-text-muted">{floorRooms.length} xona</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {floorRooms.map((r) => {
                const occ = occupancy.get(r.id) ?? 0;
                const cap = r.capacity ?? 0;
                const pct = cap ? (occ / cap) * 100 : 0;
                const bar = pct >= 100 ? "bg-danger-500" : pct >= 70 ? "bg-amber-500" : "bg-success";
                const nurses = nursesByRoom.get(r.id);
                return (
                  <div key={r.id} className="group border border-border rounded-xl bg-surface p-3 hover:shadow-sm transition-shadow relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <DoorOpen className="w-4 h-4 text-text-muted flex-shrink-0" />
                        <span className="font-medium text-text text-sm truncate">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${bar}`} />
                        <button
                          onClick={() => setEdit(r)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-text-muted hover:text-text rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-2">
                      <div className={`h-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="text-xs text-text-muted">{occ}/{cap} o'rin</div>
                    {nurses && nurses.size > 0 && (
                      <div className="text-xs text-text-muted mt-1 truncate">👩‍⚕️ {nurses.size} hamshira</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </PageContent>

      {edit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-[360px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-text flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {edit.name}
              </h3>
              <button onClick={() => setEdit(null)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <RoomEditForm
              room={edit}
              onSave={(data) => updateMutation.mutate({ id: edit.id, data })}
              pending={updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </>
  );
}

function RoomEditForm({ room, onSave, pending }: { room: Room; onSave: (d: Partial<Room>) => void; pending: boolean }) {
  const [floor, setFloor] = useState<string>(room.floor != null ? String(room.floor) : "");
  const [capacity, setCapacity] = useState<string>(room.capacity != null ? String(room.capacity) : "");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted block mb-1">Qavat</label>
          <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Sig'im</label>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={() => onSave({
            floor: floor === "" ? null : Number(floor),
            capacity: capacity === "" ? undefined : Number(capacity),
          })}
          disabled={pending}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${cls}`} />{label}</span>;
}
