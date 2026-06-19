"use client";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { fmtHM, ResolvedSlot, shiftsApi, WorkingHoursLog } from "@/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, UserCheck, Users } from "lucide-react";
import { useMemo } from "react";

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function StaffingOverviewPage() {
  const today = ymd(new Date());
  const weekAgo = ymd(new Date(Date.now() - 6 * 86400000));

  const { data: slots = [] } = useQuery<ResolvedSlot[]>({
    queryKey: ["resolved-range", today, today],
    queryFn: () => shiftsApi.resolvedRange({ from: today, to: today }),
  });
  const { data: hours = [] } = useQuery<WorkingHoursLog[]>({
    queryKey: ["work-hours-week", weekAgo, today],
    queryFn: () => shiftsApi.workHours({ from: weekAgo, to: today }),
  });

  const m = useMemo(() => {
    const docs = new Set<string>();
    const nurses = new Set<string>();
    slots.forEach((s) => {
      if (s.doctor) docs.add(s.doctor.id);
      s.nurses.forEach((n) => nurses.add(n.nurseId));
    });
    const total = slots.length;
    const assigned = slots.filter((s) => s.doctor).length;
    const coverage = total ? Math.round((assigned / total) * 100) : 0;
    const overtimeCount = new Set(hours.filter((h) => h.overtimeHours > 0).map((h) => h.user.id)).size;

    // per-doctor load today
    const load = new Map<string, { name: string; rooms: number; shifts: Set<string> }>();
    slots.forEach((s) => {
      if (!s.doctor) return;
      const cur = load.get(s.doctor.id) ?? { name: `${s.doctor.first_name} ${s.doctor.last_name}`, rooms: 0, shifts: new Set() };
      cur.rooms += 1; cur.shifts.add(s.shift.id); load.set(s.doctor.id, cur);
    });
    return {
      docs: docs.size, nurses: nurses.size, coverage, overtimeCount,
      load: [...load.values()].sort((a, b) => b.rooms - a.rooms),
      unassigned: slots.filter((s) => !s.doctor),
    };
  }, [slots, hours]);

  return (
    <>
      <PageHeader title="Xodimlar qamrovi" subtitle={`Bugungi holat — ${today}`} />

      <PageContent>
        <Grid cols={4}>
          <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-primary" /></div><Stat label="Faol shifokorlar" value={m.docs} /></div></Card>
          <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><Stat label="Faol hamshiralar" value={m.nurses} /></div></Card>
          <Card>
            <div className="space-y-2"><p className="text-sm text-text-muted">Qamrov</p>
              <span className={`text-2xl font-bold ${m.coverage >= 90 ? "text-success" : m.coverage >= 60 ? "text-amber-600" : "text-danger-500"}`}>{m.coverage}%</span></div>
          </Card>
          <Card><Stat label="Qo'shimcha vaqt (hafta)" value={m.overtimeCount} unit="xodim" /></Card>
        </Grid>

        <Grid cols={2}>
          <Card title="Shifokorlar yuklamasi (bugun)">
            {m.load.length === 0 ? <p className="text-sm text-text-muted py-4">Bugun tayinlangan shifokor yo'q</p> : (
              <div className="space-y-2">
                {m.load.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /><span className="text-sm text-text">{d.name}</span></div>
                    <div className="flex gap-2 text-xs text-text-muted">
                      <span className="px-2 py-0.5 bg-surface rounded-full border border-border">{d.shifts.size} smena</span>
                      <span className="px-2 py-0.5 bg-surface rounded-full border border-border">{d.rooms} xona</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Qamrovsiz smenalar">
            {m.unassigned.length === 0 ? <p className="text-sm text-success py-4">Barcha smenalar qamrab olingan ✓</p> : (
              <div className="space-y-2">
                {m.unassigned.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-sm text-text">{s.room.name} · {s.shift.name}</span>
                    <span className="text-xs text-amber-700">{fmtHM(s.shift.startHour)}–{fmtHM(s.shift.endHour)}</span>
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
