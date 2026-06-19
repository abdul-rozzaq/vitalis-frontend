"use client";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { fmtHM, ResolvedSlot, shiftsApi, WorkingHoursLog } from "@/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, DoorClosed } from "lucide-react";
import { useMemo, useState } from "react";

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function ShiftCoveragePage() {
  const [date, setDate] = useState(ymd(new Date()));
  const weekAgo = ymd(new Date(Date.now() - 6 * 86400000));

  const { data: slots = [] } = useQuery<ResolvedSlot[]>({
    queryKey: ["resolved-range", date, date],
    queryFn: () => shiftsApi.resolvedRange({ from: date, to: date }),
  });

  const { data: hours = [] } = useQuery<WorkingHoursLog[]>({
    queryKey: ["work-hours-week", weekAgo, date],
    queryFn: () => shiftsApi.workHours({ from: weekAgo, to: date }),
  });

  const stats = useMemo(() => {
    const total = slots.length;
    const assigned = slots.filter((s) => s.doctor).length;
    const unassigned = slots.filter((s) => !s.doctor);
    const overrides = slots.filter((s) => s.source === "override").length;
    const coverage = total ? Math.round((assigned / total) * 100) : 0;
    return { total, assigned, unassigned, overrides, coverage };
  }, [slots]);

  const overtimeStaff = useMemo(() => {
    const map = new Map<string, { name: string; overtime: number }>();
    hours.forEach((h) => {
      if (h.overtimeHours > 0) {
        const key = h.user.id;
        const cur = map.get(key) ?? { name: `${h.user.first_name} ${h.user.last_name}`, overtime: 0 };
        cur.overtime += h.overtimeHours;
        map.set(key, cur);
      }
    });
    return [...map.values()].sort((a, b) => b.overtime - a.overtime);
  }, [hours]);

  return (
    <>
      <PageHeader
        title="Smena qamrovi"
        subtitle="Yetishmayotgan xodimlar, bo'sh xonalar va qo'shimcha ish vaqti"
        actions={<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text" />}
      />

      <PageContent>
        <Grid cols={4}>
          <Card><Stat label="Jami slotlar" value={stats.total} /></Card>
          <Card><Stat label="Tayinlangan" value={stats.assigned} unit={`/ ${stats.total}`} /></Card>
          <Card><Stat label="Override" value={stats.overrides} /></Card>
          <Card>
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Qamrov</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${stats.coverage >= 90 ? "text-success" : stats.coverage >= 60 ? "text-amber-600" : "text-danger-500"}`}>{stats.coverage}%</span>
              </div>
            </div>
          </Card>
        </Grid>

        <Grid cols={2}>
          {/* Unassigned rooms */}
          <Card title="Bo'sh smenalar (shifokorsiz)">
            {stats.unassigned.length === 0 ? (
              <div className="flex items-center gap-2 text-success text-sm py-4"><CheckCircle2 className="w-5 h-5" /> Barcha smenalar tayinlangan</div>
            ) : (
              <div className="space-y-2">
                {stats.unassigned.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <DoorClosed className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-text">{s.room.name}</span>
                      <span className="text-xs text-text-muted">{s.shift.name}</span>
                    </div>
                    <span className="text-xs text-amber-700">{fmtHM(s.shift.startHour)}–{fmtHM(s.shift.endHour)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Overtime employees */}
          <Card title="Qo'shimcha ish vaqti (oxirgi 7 kun)">
            {overtimeStaff.length === 0 ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4"><Clock className="w-5 h-5" /> Qo'shimcha ish vaqti yo'q</div>
            ) : (
              <div className="space-y-2">
                {overtimeStaff.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-text">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-purple-700">+{s.overtime.toFixed(1)} soat</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Grid>
      </PageContent>
    </>
  );
}
