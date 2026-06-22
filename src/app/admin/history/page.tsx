"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { fmtHM, ShiftChangeEvent, ShiftEventType, shiftsApi, SHIFT_EVENT_COLOR, SHIFT_EVENT_LABEL } from "@/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";

const EVENT_TYPES: ShiftEventType[] = [
  "FULL_TRANSFER", "PARTIAL_TRANSFER", "OVERTIME_ADDED", "OVERRIDE_CREATED", "OVERRIDE_DELETED",
  "SWAP_REQUEST", "SWAP_APPROVED", "SWAP_REJECTED",
];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function AssignmentHistoryPage() {
  const [from, setFrom] = useState(ymd(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(ymd(new Date()));
  const [type, setType] = useState<ShiftEventType | "">("");

  const { data: events = [], isLoading } = useQuery<ShiftChangeEvent[]>({
    queryKey: ["shift-events", from, to, type],
    queryFn: () => shiftsApi.events({ from, to, type: type || undefined }),
  });

  return (
    <>
      <PageHeader title="O'zgarishlar tarixi" subtitle="Almashtirish, o'tkazish, override va qo'shimcha ish vaqti — barcha tarixiy yozuvlar" />

      <PageContent>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Dan</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Gacha</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Tur</label>
            <select value={type} onChange={(e) => setType(e.target.value as ShiftEventType | "")} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
              <option value="">Barchasi</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{SHIFT_EVENT_LABEL[t]}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-text-muted py-12"><History className="w-8 h-8 mx-auto opacity-30 animate-pulse" /></div>
        ) : events.length === 0 ? (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Tarix yozuvi yo'q</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="p-3 font-medium">Sana</th>
                  <th className="p-3 font-medium">Tur</th>
                  <th className="p-3 font-medium">Smena</th>
                  <th className="p-3 font-medium">Kimdan</th>
                  <th className="p-3 font-medium">Kimga</th>
                  <th className="p-3 font-medium">Oyna</th>
                  <th className="p-3 font-medium">So'ragan</th>
                  <th className="p-3 font-medium">Sabab</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="p-3 text-text-muted whitespace-nowrap">{e.date.slice(0, 10)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${SHIFT_EVENT_COLOR[e.eventType]}`}>{SHIFT_EVENT_LABEL[e.eventType]}</span></td>
                    <td className="p-3 text-text">{e.roomShift?.name ?? "—"}</td>
                    <td className="p-3 text-text">{e.fromDoctor.first_name} {e.fromDoctor.last_name}</td>
                    <td className="p-3 text-text">{e.toDoctor ? `${e.toDoctor.first_name} ${e.toDoctor.last_name}` : "—"}</td>
                    <td className="p-3 text-text-muted whitespace-nowrap">{e.windowStart != null && e.windowEnd != null ? `${fmtHM(e.windowStart)}–${fmtHM(e.windowEnd)}` : "—"}</td>
                    <td className="p-3 text-text-muted">{e.requestedBy.first_name} {e.requestedBy.last_name}</td>
                    <td className="p-3 text-text-muted max-w-[200px] truncate">{e.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContent>
    </>
  );
}
