"use client";
import { useTranslations } from "next-intl";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { ActiveShift, fmtHM, shiftsApi, WardPatient, WardRoundRef } from "@/lib/shifts-api";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BedDouble, CheckCircle2, ClipboardList, Clock, ListTodo, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type TaskStatus = "pending" | "in_progress" | "done";

export default function NurseDashboardPage() {
  const t = useTranslations();
  const { data: active = [], isLoading } = useQuery<ActiveShift[]>({
    queryKey: ["my-active-shifts"], queryFn: shiftsApi.myActiveShifts, refetchInterval: 60000,
  });

  const rooms = useMemo(() => [...new Set(active.map((s) => s.roomId))], [active]);
  const patientQueries = useQueries({
    queries: rooms.map((roomId) => ({ queryKey: ["room-patients", roomId], queryFn: () => shiftsApi.roomPatients(roomId), refetchInterval: 60000 })),
  });
  const allPatients = patientQueries.flatMap((q) => (q.data as WardPatient[] | undefined) ?? []).filter((p) => p.status === "OCCUPIED");

  // rounds per assignment (only materialized shifts)
  const roundQueries = useQueries({
    queries: active.filter((s) => s.assignmentId).map((s) => ({
      queryKey: ["ward-rounds", s.assignmentId],
      queryFn: () => shiftsApi.roundsByAssignment(s.assignmentId!),
      refetchInterval: 60000,
    })),
  });
  const roundsByAssignment = useMemo(() => {
    const map = new Map<string, WardRoundRef[]>();
    const withId = active.filter((s) => s.assignmentId);
    withId.forEach((s, i) => { map.set(s.assignmentId!, (roundQueries[i]?.data as WardRoundRef[] | undefined) ?? []); });
    return map;
  }, [active, roundQueries]);

  // Build tasks: one apoxot task per active shift
  const tasks = active.map((s) => {
    const rounds = s.assignmentId ? roundsByAssignment.get(s.assignmentId) ?? [] : [];
    const activeRound = rounds.find((r) => !r.completedAt);
    const completed = rounds.filter((r) => r.completedAt).length;
    const status: TaskStatus = activeRound ? "in_progress" : completed > 0 ? "done" : "pending";
    return { key: `${s.roomShiftId}-${s.roomId}`, room: s.room.name, shift: s.roomShift, status, completed };
  });

  const pending = tasks.filter((t) => t.status === "pending").length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <>
      <PageHeader title={t("workspace.nurseTitle")} subtitle={t("workspace.nurseSubtitle")}
        actions={<Link href="/wards/duty" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"><ClipboardList className="w-4 h-4" /> Navbatga o'tish</Link>} />

      <PageContent>
        <Grid cols={4}>
          <Card><div className="flex items-center gap-3"><IconBox><Clock className="w-5 h-5 text-primary" /></IconBox><Stat label="Joriy smenalar" value={active.length} /></div></Card>
          <Card><div className="flex items-center gap-3"><IconBox><BedDouble className="w-5 h-5 text-primary" /></IconBox><Stat label="Xonalar" value={rooms.length} /></div></Card>
          <Card><div className="flex items-center gap-3"><IconBox><Users className="w-5 h-5 text-primary" /></IconBox><Stat label="Bemorlar" value={allPatients.length} /></div></Card>
          <Card><div className="flex items-center gap-3"><IconBox><ListTodo className="w-5 h-5 text-primary" /></IconBox><Stat label={t("adminStaffing.pendingTask")} value={pending} /></div></Card>
        </Grid>

        <Grid cols={2}>
          <Card title="Vazifalar (apoxot)" action={<Link href="/wards/duty" className="text-xs text-primary hover:underline">Bajarish</Link>}>
            {isLoading ? <p className="text-sm text-text-muted py-4">Yuklanmoqda...</p>
              : tasks.length === 0 ? <p className="text-sm text-text-muted py-4">Faol vazifa yo'q</p>
              : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.key} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="text-sm text-text font-medium">Apoxot — {t.room}</p>
                          <p className="text-xs text-text-muted">{t.shift.name} · {fmtHM(t.shift.startHour)}–{fmtHM(t.shift.endHour)}</p>
                        </div>
                      </div>
                      <TaskBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
          </Card>

          <Card title={t("workspace.completedToday")}>
            {done === 0 ? <p className="text-sm text-text-muted py-4">Hali yakunlangan apoxot yo'q</p>
              : (
                <div className="space-y-2">
                  {tasks.filter((t) => t.completed > 0).map((t) => (
                    <div key={t.key} className="flex items-center justify-between p-2.5 rounded-lg bg-success-50 border border-success-100">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-sm text-text">{t.room}</span></div>
                      <span className="text-xs text-success">{t.completed} apoxot</span>
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

function TaskBadge({ status }: { status: TaskStatus }) {
  const map = {
    pending: { label: "Kutilmoqda", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    in_progress: { label: "Jarayonda", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    done: { label: "Bajarilgan", cls: "bg-success-50 text-success border-success-100" },
  }[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map.cls}`}>{map.label}</span>;
}
function IconBox({ children }: { children: React.ReactNode }) {
  return <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">{children}</div>;
}
