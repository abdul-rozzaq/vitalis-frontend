"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { RoomShift, shiftsApi } from "@/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { Building, DoorOpen, User } from "lucide-react";
import { useMemo } from "react";

interface Room {
  id: string; name: string; roomNumber: string | null; floor: number | null;
  capacity: number | null; roomType: string; department?: { name: string } | null;
}
interface Ward { roomId?: string; room?: { id: string }; status: string }

export default function FloorViewPage() {
  const { data: rooms = [], isLoading } = useQuery<Room[]>({ queryKey: ["rooms-all"], queryFn: () => api.get("/rooms").then((r) => r.data.data ?? r.data) });
  const { data: shifts = [] } = useQuery<RoomShift[]>({ queryKey: ["room-shifts"], queryFn: () => shiftsApi.listTemplates() });
  const { data: wards = [] } = useQuery<Ward[]>({ queryKey: ["wards-all"], queryFn: () => api.get("/wards").then((r) => r.data.data ?? r.data) });

  const occupancy = useMemo(() => {
    const map = new Map<string, number>();
    wards.forEach((w) => { const rid = w.roomId ?? w.room?.id; if (rid && w.status === "OCCUPIED") map.set(rid, (map.get(rid) ?? 0) + 1); });
    return map;
  }, [wards]);

  const doctorByRoom = useMemo(() => {
    const map = new Map<string, string>();
    shifts.forEach((sh) => sh.rooms.forEach((sr) => { if (sh.doctor && !map.has(sr.roomId)) map.set(sr.roomId, `${sh.doctor.first_name} ${sh.doctor.last_name}`); }));
    return map;
  }, [shifts]);

  const byFloor = useMemo(() => {
    const map = new Map<number | "none", Room[]>();
    rooms.forEach((r) => { const k = r.floor ?? "none"; if (!map.has(k)) map.set(k, []); map.get(k)!.push(r); });
    return [...map.entries()].sort((a, b) => (a[0] === "none" ? 1 : b[0] === "none" ? -1 : (a[0] as number) - (b[0] as number)));
  }, [rooms]);

  return (
    <>
      <PageHeader title="Qavatlar ko'rinishi" subtitle="Binoning vizual joylashuvi — xonalar va bandlik" />
      <PageContent>
        <div className="flex gap-3 text-xs text-text-muted">
          <Legend cls="bg-success" label="Bo'sh" /><Legend cls="bg-amber-500" label="Qisman" /><Legend cls="bg-danger-500" label="To'la" />
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-12"><Building className="w-8 h-8 mx-auto opacity-30 animate-pulse" /></div>
        ) : byFloor.map(([floor, floorRooms]) => (
          <div key={String(floor)} className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-text">{floor === "none" ? "Qavat belgilanmagan" : `${floor}-qavat`}</h3>
              <span className="text-xs text-text-muted">{floorRooms.length} xona</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {floorRooms.map((r) => {
                const occ = occupancy.get(r.id) ?? 0;
                const cap = r.capacity ?? 0;
                const pct = cap ? (occ / cap) * 100 : 0;
                const bar = pct >= 100 ? "bg-danger-500" : pct >= 70 ? "bg-amber-500" : "bg-success";
                const doctor = doctorByRoom.get(r.id);
                return (
                  <div key={r.id} className="border border-border rounded-xl bg-surface p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="w-4 h-4 text-text-muted" />
                        <span className="font-medium text-text text-sm">{r.roomNumber ?? r.name}</span>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${bar}`} />
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-2">
                      <div className={`h-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{occ}/{cap} o'rin</span>
                    </div>
                    {doctor && <div className="flex items-center gap-1 mt-1.5 text-xs text-text-muted truncate"><User className="w-3 h-3" />{doctor}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </PageContent>
    </>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${cls}`} />{label}</span>;
}
