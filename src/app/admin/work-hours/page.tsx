"use client";
import { useTranslations } from "next-intl";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { fmtHM, shiftsApi, WorkingHoursLog, WorkingHoursSummary } from "@/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useState } from "react";

interface Staff { id: string; first_name: string; last_name: string; role: string }
function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function WorkHoursPage() {
  const t = useTranslations();
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const days = period === "week" ? 7 : 30;
  const from = ymd(new Date(Date.now() - (days - 1) * 86400000));
  const to = ymd(new Date());

  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["staff-list"], queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data) });
  const eligible = staff.filter((s) => s.role === "DOCTOR" || s.role === "HAMSHIRA");

  const { data: logs = [], isLoading } = useQuery<WorkingHoursLog[]>({
    queryKey: ["work-hours", userId, from, to],
    queryFn: () => shiftsApi.workHours({ userId: userId || undefined, from, to }),
  });

  const { data: summary } = useQuery<WorkingHoursSummary>({
    queryKey: ["work-hours-summary", userId, period],
    queryFn: () => shiftsApi.workHoursSummary(userId, period),
    enabled: !!userId,
  });

  return (
    <>
      <PageHeader
        title={t("adminWorkHours.title")}
        subtitle={t("adminWorkHours.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-text">
              <option value="">Barcha xodimlar</option>
              {eligible.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>)}
            </select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              {(["week", "month"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm ${period === p ? "bg-primary text-white" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {p === "week" ? "Hafta" : "Oy"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <PageContent>
        {userId && summary && (
          <Grid cols={4}>
            <Card><Stat label="Reja soatlari" value={summary.totalPlanned.toFixed(1)} unit="soat" /></Card>
            <Card><Stat label={t("adminWorkHours.worked")} value={summary.totalActual.toFixed(1)} unit="soat" /></Card>
            <Card>
              <div className="space-y-2">
                <p className="text-sm text-text-muted">Qo'shimcha</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${summary.totalOvertime > 0 ? "text-purple-600" : "text-text"}`}>+{summary.totalOvertime.toFixed(1)}</span>
                  <span className="text-sm text-text-muted">soat</span>
                </div>
              </div>
            </Card>
            <Card><Stat label={t("adminWorkHours.workDays")} value={summary.days} unit="kun" /></Card>
          </Grid>
        )}

        {isLoading ? (
          <div className="text-center text-text-muted py-12"><Clock className="w-8 h-8 mx-auto opacity-30 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Ish soati yozuvi yo'q</p>
            <p className="text-sm mt-1">Yozuvlar har kecha avtomatik hisoblanadi</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="p-3 font-medium">Sana</th>
                  {!userId && <th className="p-3 font-medium">Xodim</th>}
                  <th className="p-3 font-medium">Smena</th>
                  <th className="p-3 font-medium">Reja</th>
                  <th className="p-3 font-medium">Ishlangan</th>
                  <th className="p-3 font-medium">Qo'shimcha</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="p-3 text-text-muted whitespace-nowrap">{l.date.slice(0, 10)}</td>
                    {!userId && <td className="p-3 text-text">{l.user.first_name} {l.user.last_name}</td>}
                    <td className="p-3 text-text">{l.shiftAssignment?.roomShift.name ?? "—"}</td>
                    <td className="p-3 text-text-muted">{fmtHM(l.plannedStart)}–{fmtHM(l.plannedEnd)} ({l.plannedHours}s)</td>
                    <td className="p-3 text-text">{l.actualHours.toFixed(1)} soat</td>
                    <td className="p-3">{l.overtimeHours > 0 ? <span className="text-purple-600 font-medium">+{l.overtimeHours.toFixed(1)}</span> : <span className="text-text-muted">—</span>}</td>
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
