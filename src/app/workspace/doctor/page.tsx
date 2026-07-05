"use client";

import { useTranslations } from "next-intl";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { StaffingBadge } from "@/features/shifts/components/staffing-badge";
import type { Shift } from "@/shared/lib/shifts-api";
import { fmtShiftDay, fmtShiftRange, shiftsApi } from "@/shared/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, Stethoscope } from "lucide-react";
import Link from "next/link";

export default function DoctorDashboardPage() {
  const t = useTranslations();
  const { data: active = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["my-active-shifts"],
    queryFn: shiftsApi.myActive,
    refetchInterval: 60000,
  });
  const { data: upcoming = [] } = useQuery<Shift[]>({
    queryKey: ["my-upcoming-shifts"],
    queryFn: shiftsApi.myUpcoming,
  });

  return (
    <>
      <PageHeader
        title={t("workspace.doctorTitle")}
        subtitle={t("workspace.doctorSubtitle")}
        actions={
          <Link href="/wards/duty" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            <ClipboardList className="w-4 h-4" /> Navbatga o'tish
          </Link>
        }
      />

      <PageContent>
        <Grid cols={3}>
          <Card>
            <div className="flex items-center gap-3">
              <IconBox>
                <Stethoscope className="w-5 h-5 text-primary" />
              </IconBox>
              <Stat label="Joriy smenalar" value={active.length} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <IconBox>
                <CalendarClock className="w-5 h-5 text-primary" />
              </IconBox>
              <Stat label="Kelgusi smenalar" value={upcoming.length} />
            </div>
          </Card>
          <Card>
            <Stat label="Bugungi holat" value={active.length > 0 ? "Navbatdasiz" : "Navbatda emas"} />
          </Card>
        </Grid>

        <Grid cols={2}>
          <Card title="Joriy smenalar" action={<Link href="/wards/duty" className="text-xs text-primary hover:underline">Batafsil</Link>}>
            {isLoading ? (
              <p className="text-sm text-text-muted py-4">Yuklanmoqda...</p>
            ) : active.length === 0 ? (
              <p className="text-sm text-text-muted py-4">Hozir faol smenada emassiz</p>
            ) : (
              <div className="space-y-2">
                {active.map((s) => (
                  <ShiftRow key={s.id} shift={s} />
                ))}
              </div>
            )}
          </Card>

          <Card title="Kelgusi smenalar">
            {upcoming.length === 0 ? (
              <p className="text-sm text-text-muted py-4">Kelgusi smena yo'q</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 8).map((s) => (
                  <ShiftRow key={s.id} shift={s} showDay />
                ))}
              </div>
            )}
          </Card>
        </Grid>
      </PageContent>
    </>
  );
}

function ShiftRow({ shift, showDay }: { shift: Shift; showDay?: boolean }) {
  return (
    <Link href={`/shifts/${shift.id}`} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/40 transition-colors">
      <div>
        <p className="text-sm text-text font-medium">{shift.department.name}</p>
        <p className="text-xs text-text-muted">
          {showDay ? `${fmtShiftDay(shift.startAt)} · ` : ""}
          {fmtShiftRange(shift.startAt, shift.endAt)}
        </p>
      </div>
      <StaffingBadge staffing={shift.staffing} />
    </Link>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">{children}</div>;
}
