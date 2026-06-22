"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, DoorOpen, Edit2, GripVertical, Layers, Plus, X } from "lucide-react";
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

  // drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overFloor, setOverFloor] = useState<number | "none" | null>(null);

  // new floor zone
  const [extraFloors, setExtraFloors] = useState<number[]>([]);
  const [showNewFloor, setShowNewFloor] = useState(false);
  const [newFloorVal, setNewFloorVal] = useState("");

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

  const dataFloors = useMemo(() => {
    const s = new Set<number>();
    rooms.forEach((r) => { if (r.floor != null) s.add(r.floor); });
    return [...s].sort((a, b) => a - b);
  }, [rooms]);

  const allFloors = useMemo(() => {
    const merged = new Set([...dataFloors, ...extraFloors]);
    return [...merged].sort((a, b) => a - b);
  }, [dataFloors, extraFloors]);

  const byFloor = useMemo(() => {
    const map = new Map<number | "none", Room[]>();
    map.set("none", []);
    allFloors.forEach((f) => map.set(f, []));
    rooms.forEach((r) => {
      const key = r.floor ?? "none";
      if (!map.has(key as number)) map.set(key as number, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [rooms, allFloors]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) =>
      api.patch(`/rooms/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-all"] });
      setEdit(null);
      toast.success("Yangilandi");
    },
    onError: () => toast.error("Xatolik"),
  });

  function handleDrop(targetFloor: number | "none") {
    if (!draggedId) return;
    const room = rooms.find((r) => r.id === draggedId);
    const newFloor = targetFloor === "none" ? null : targetFloor;
    clearDrag();
    if (!room || room.floor === newFloor) return;
    updateMutation.mutate({ id: draggedId, data: { floor: newFloor } });
  }

  function clearDrag() {
    setDraggedId(null);
    setOverFloor(null);
  }

  function addFloor() {
    const n = parseInt(newFloorVal);
    if (!isNaN(n) && n >= 0 && !allFloors.includes(n)) {
      setExtraFloors((p) => [...p, n]);
    }
    setNewFloorVal("");
    setShowNewFloor(false);
  }

  const isDragging = draggedId != null;

  return (
    <>
      <PageHeader title="Xonalar" subtitle="Binoning qavatlar bo'yicha ko'rinishi" />

      <PageContent>
        <div className="flex gap-3 items-center flex-wrap">
          <Legend cls="bg-success" label="Bo'sh" />
          <Legend cls="bg-amber-500" label="Qisman" />
          <Legend cls="bg-danger-500" label="To'la" />
          {isDragging && (
            <span className="ml-2 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <GripVertical className="w-3 h-3" />
              Qavatga tashlang
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-12">
            <Building className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Floors */}
            {[...byFloor.entries()].map(([floor, floorRooms]) => {
              const isOver = overFloor === floor;
              const label = floor === "none" ? "Qavat belgilanmagan" : `${floor}-qavat`;

              return (
                <div
                  key={String(floor)}
                  className={`rounded-xl border-2 transition-colors ${
                    isOver ? "border-primary bg-primary/5" : "border-transparent"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setOverFloor(floor); }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(floor); }}
                >
                  {/* Floor header */}
                  <div className={`flex items-center gap-2 px-1 py-1 ${isDragging ? "cursor-copy" : ""}`}>
                    <Building className={`w-4 h-4 ${isOver ? "text-primary" : "text-primary"}`} />
                    <h3 className={`font-semibold text-sm ${isOver ? "text-primary" : "text-text"}`}>
                      {label}
                    </h3>
                    <span className="text-xs text-text-muted">{floorRooms.length} xona</span>
                    {isOver && (
                      <span className="ml-1 text-xs text-primary font-medium animate-pulse">
                        ← bu yerga qo'yish
                      </span>
                    )}
                  </div>

                  {/* Room cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 px-1 pb-2">
                    {floorRooms.map((r) => {
                      const occ = occupancy.get(r.id) ?? 0;
                      const cap = r.capacity ?? 0;
                      const pct = cap ? (occ / cap) * 100 : 0;
                      const bar = pct >= 100 ? "bg-danger-500" : pct >= 70 ? "bg-amber-500" : "bg-success";
                      const nurses = nursesByRoom.get(r.id);
                      return (
                        <div
                          key={r.id}
                          draggable
                          onDragStart={() => setDraggedId(r.id)}
                          onDragEnd={clearDrag}
                          className={`group border border-border rounded-xl bg-surface p-3 transition-all select-none
                            ${draggedId === r.id
                              ? "opacity-40 scale-95 cursor-grabbing"
                              : "hover:shadow-sm cursor-grab"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GripVertical className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-50 flex-shrink-0 transition-opacity" />
                              <DoorOpen className="w-4 h-4 text-text-muted flex-shrink-0" />
                              <span className="font-medium text-text text-sm truncate">{r.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className={`w-2.5 h-2.5 rounded-full ${bar}`} />
                              <button
                                onClick={(e) => { e.stopPropagation(); setEdit(r); }}
                                onMouseDown={(e) => e.stopPropagation()}
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
                            <div className="text-xs text-text-muted mt-1 truncate">
                              👩‍⚕️ {nurses.size} hamshira
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Drop placeholder */}
                    {isOver && isDragging && (
                      <div className="border-2 border-dashed border-primary/50 rounded-xl h-[108px] flex items-center justify-center bg-primary/5">
                        <span className="text-xs text-primary font-medium">+</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add new floor zone */}
            <div className="px-1">
              {showNewFloor ? (
                <div className="border-2 border-dashed border-border rounded-xl p-4 bg-surface flex items-center gap-3 w-fit">
                  <Layers className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Qavat raqami:</span>
                    <input
                      type="number"
                      min={0}
                      value={newFloorVal}
                      onChange={(e) => setNewFloorVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addFloor();
                        if (e.key === "Escape") { setShowNewFloor(false); setNewFloorVal(""); }
                      }}
                      autoFocus
                      placeholder="1"
                      className="w-20 border border-border rounded-lg px-2 py-1 text-sm bg-background text-text"
                    />
                    <button onClick={addFloor} className="text-xs px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90">
                      Qo'shish
                    </button>
                    <button
                      onClick={() => { setShowNewFloor(false); setNewFloorVal(""); }}
                      className="p-1 rounded text-text-muted hover:text-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFloor(true)}
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-primary border-2 border-dashed border-border hover:border-primary/40 rounded-xl px-4 py-3 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Yangi qavat qo'shish
                </button>
              )}
            </div>
          </div>
        )}
      </PageContent>

      {/* Edit modal */}
      {edit && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEdit(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-[360px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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

function RoomEditForm({
  room,
  onSave,
  pending,
}: {
  room: Room;
  onSave: (d: Partial<Room>) => void;
  pending: boolean;
}) {
  const [floor, setFloor] = useState<string>(room.floor != null ? String(room.floor) : "");
  const [capacity, setCapacity] = useState<string>(room.capacity != null ? String(room.capacity) : "");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted block mb-1">Qavat</label>
          <input
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Sig'im</label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-text"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={() =>
            onSave({
              floor: floor === "" ? null : Number(floor),
              capacity: capacity === "" ? undefined : Number(capacity),
            })
          }
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
  return (
    <span className="flex items-center gap-1 text-xs text-text-muted">
      <span className={`w-3 h-3 rounded-full ${cls}`} />
      {label}
    </span>
  );
}
