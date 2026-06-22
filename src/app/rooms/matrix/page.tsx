"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { fmtHM, RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Grid3x3, Square, Users } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Room { id: string; name: string; roomType: string; floor: number | null }

export default function AssignmentMatrixPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ["rooms-all"], queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data) });
  const wardRooms = useMemo(() => rooms.filter((r) => r.roomType === "WARD"), [rooms]);

  const { data: shifts = [] } = useQuery<RoomShift[]>({ queryKey: ["room-shifts"], queryFn: () => shiftsApi.listTemplates() });
  const selected = shifts.find((s) => s.id === selectedId) ?? null;
  const coveredRoomIds = useMemo(() => new Set(selected?.rooms.map((r) => r.roomId) ?? []), [selected]);

  const addRoom = useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId: string }) => shiftsApi.addRoomToTemplate(id, roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-shifts"] }), onError: () => toast.error("Xatolik"),
  });
  const removeRoom = useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId: string }) => shiftsApi.removeRoomFromTemplate(id, roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-shifts"] }), onError: () => toast.error("Xatolik"),
  });

  function toggle(roomId: string) {
    if (!selectedId) return;
    if (coveredRoomIds.has(roomId)) removeRoom.mutate({ id: selectedId, roomId });
    else addRoom.mutate({ id: selectedId, roomId });
  }

  async function bulk(select: boolean) {
    if (!selectedId) return;
    const targets = wardRooms.filter((r) => coveredRoomIds.has(r.id) !== select);
    for (const r of targets) {
      if (select) await shiftsApi.addRoomToTemplate(selectedId, r.id);
      else await shiftsApi.removeRoomFromTemplate(selectedId, r.id);
    }
    qc.invalidateQueries({ queryKey: ["room-shifts"] });
    toast.success(select ? "Barcha xonalar biriktirildi" : "Barcha xonalar olib tashlandi");
  }

  return (
    <>
      <PageHeader title="Xona matritsasi" subtitle="Smena shablonini tanlab, xonalarni bir vaqtda biriktiring" />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
          {/* Templates list */}
          <div className="border border-border rounded-xl bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-medium text-text">Smena shablonlari</div>
            <div className="max-h-[60vh] overflow-y-auto">
              {shifts.length === 0 ? <p className="p-4 text-sm text-text-muted">Shablon yo'q</p> : shifts.map((s) => (
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${selectedId === s.id ? "bg-primary-50" : "hover:bg-surface-hover"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? "#888" }} />
                    <span className="text-sm font-medium text-text">{s.name}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                    <span>{fmtHM(s.startHour)}–{fmtHM(s.endHour)}</span>
                    <span>· {s.rooms.length} xona</span>
                  </div>
                  {s.defaultNurses.length > 0 && <div className="text-xs text-text-muted mt-0.5">👩‍⚕️ {s.defaultNurses.length} hamshira</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms grid */}
          <div className="border border-border rounded-xl bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-text flex items-center gap-2"><Grid3x3 className="w-4 h-4 text-primary" />Palata xonalari</div>
              {selected && (
                <div className="flex items-center gap-2">
                  <button onClick={() => bulk(true)} className="text-xs px-2.5 py-1 border border-border rounded-lg hover:bg-surface-hover text-text">Hammasi</button>
                  <button onClick={() => bulk(false)} className="text-xs px-2.5 py-1 border border-border rounded-lg hover:bg-surface-hover text-text">Tozalash</button>
                </div>
              )}
            </div>

            {!selected ? (
              <div className="p-10 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                <Users className="w-8 h-8 opacity-30" />Chapdan smena shablonini tanlang
              </div>
            ) : wardRooms.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-muted">Palata xonalar yo'q</p>
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {wardRooms.map((r) => {
                  const on = coveredRoomIds.has(r.id);
                  return (
                    <button key={r.id} onClick={() => toggle(r.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${on ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-text hover:bg-surface-hover"}`}>
                      {on ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0 text-text-muted" />}
                      <span className="truncate">{r.name}</span>
                      {r.floor != null && <span className="text-[10px] text-text-muted ml-auto">{r.floor}q</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {selected && <p className="px-4 pb-4 text-xs text-text-muted">Xonani bosing — shu shablon shu xonaga biriktiriladi/olib tashlanadi.</p>}
          </div>
        </div>
      </PageContent>
    </>
  );
}
