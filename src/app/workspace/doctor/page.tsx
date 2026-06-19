"use client";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { ActiveShift, fmtHM, MyShifts, shiftsApi, WardPatient, WorkingHoursLog } from "@/lib/shifts-api";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BedDouble, CalendarClock, ClipboardList, Clock, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function DoctorDashboardPage() {
  const { data: active = [], isLoading } = useQuery<ActiveShift[]>({
    queryKey: ["my-active-shifts"], queryFn: shiftsApi.myActiveShifts, refetchInterval: 60000,
  });
  const { data: upcoming } = useQuery<MyShifts>({ queryKey: ["my-upcoming-shifts"], queryFn: shiftsApi.myUpcomingShifts });
  const { data: hours = [] } = useQuery<WorkingHoursLog[]>({ queryKey: ["my-work-hours"], queryFn: shiftsApi.myWorkHours });

  const rooms = useMemo(() => [...new Set(active.map((s) => s.roomId))], [active]);
  const patientQueries = useQueries({
    queries: rooms.map((roomId) => ({
      queryKey: ["room-patients", roomId],
      queryFn: () => shiftsApi.roomPatients(roomId),
      refetchInterval: 60000,
    })),
  });
  const allPatients = patientQueries.flatMap((q) => (q.data as WardPatient[] | undefined) ?? []).filter((p) => p.status === "OCCUPIED");

  const overtimeWeek = hours.filter((h) => h.overtimeHours > 0).reduce((s, h) => s + h.overtimeHours, 0);
  const plannedWeek = hours.reduce((s, h) => s + h.plannedHours, 0);

  return (
    <>
      <PageHeader title="Shifokor paneli" subtitle="Joriy smena, xonalar, bemorlar va ish soatlari"
        actions={<Link href="/wards/duty" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"><ClipboardList className="w-4 h-4" /> Navbatga o'tish</Link>} />

      <PageContent>
        <Grid cols={4}>
          <Card><div className="flex items-center gap-3"><IconBox><Stethoscope className="w-5 h-5 text-primary" /></IconBox><Stat label="Joriy smenalar" value={active.length} /></div></Card>
          <Card><div className="flex items-center gap-3"><IconBox><BedDouble className="w-5 h-5 text-primary" /></IconBox><Stat label="Xonalar" value={rooms.length} /></div></Card>
          <Card><div className="flex items-center gap-3"><IconBox><Users className="w-5 h-5 text-primary" /></IconBox><Stat label="Bemorlar" value={allPatients.length} /></div></Card>
          <Card><Stat label="Reja / Qo'shimcha (hafta)" value={`${plannedWeek.toFixed(0)}s`} unit={overtimeWeek > 0 ? `+${overtimeWeek.toFixed(1)}s` : ""} /></Card>
        </Grid>

        <Grid cols={2}>
          <Card title="Joriy smenalar" action={<Link href="/wards/duty" className="text-xs text-primary hover:underline">Batafsil</Link>}>
            {isLoading ? <p className="text-sm text-text-muted py-4">Yuklanmoqda...</p>
              : active.length === 0 ? <p className="text-sm text-text-muted py-4">Hozir faol smenada emassiz</p>
              : (
                <div className="space-y-2">
                  {active.map((s) => (
                    <div key={`${s.roomShiftId}-${s.roomId}`} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm text-text font-medium">{s.room.name}</p>
                          <p className="text-xs text-text-muted">{s.roomShift.name} · {fmtHM(s.roomShift.startHour)}–{fmtHM(s.roomShift.endHour)}</p>
                        </div>
                      </div>
                      {s.isOverride && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">Override</span>}
                    </div>
                  ))}
                </div>
              )}
          </Card>

          <Card title="Kelgusi smenalar (7 kun)">
            {!upcoming || (upcoming.overrides.length === 0 && upcoming.defaultShifts.length === 0)
              ? <p className="text-sm text-text-muted py-4">Kelgusi smena yo'q</p>
              : (
                <div className="space-y-2">
                  {upcoming.overrides.slice(0, 6).map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text">{o.room.name} · {o.roomShift.name}</span></div>
                      <span className="text-xs text-text-muted">{o.date.slice(0, 10)}</span>
                    </div>
                  ))}
                  {upcoming.defaultShifts.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text">{d.name}</span></div>
                      <span className="text-xs text-text-muted">{fmtHM(d.startHour)}–{fmtHM(d.endHour)}</span>
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

function IconBox({ children }: { children: React.ReactNode }) {
  return <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">{children}</div>;
}
