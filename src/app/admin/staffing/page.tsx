"use client";

import { Card, Grid, PageContent, PageHeader, Stat } from "@/components/layouts/PageLayout";
import { StaffingBadge } from "@/features/shifts/components/staffing-badge";
import type { Shift } from "@/shared/lib/shifts-api";
import { fmtShiftDay, fmtShiftRange, isUnderstaffed, shiftsApi } from "@/shared/lib/shifts-api";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { AlertTriangle, CalendarRange, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function StaffingOverviewPage() {
  const from = format(new Date(), "yyyy-MM-dd");
  const to = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["shifts", "staffing", from, to],
    queryFn: () => shiftsApi.list({ from, to }),
  });

  const m = useMemo(() => {
    const understaffed = shifts.filter((s) => isUnderstaffed(s.staffing));
    return { total: shifts.length, understaffed, fullyStaffed: shifts.length - understaffed.length };
  }, [shifts]);

  return (
    <>
      <PageHeader title="Xodimlar qamrovi" subtitle="Keyingi 14 kun — smenalar qamrovi" />

      <PageContent>
        <Grid cols={3}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <CalendarRange className="w-5 h-5 text-primary" />
              </div>
              <Stat label="Jami smenalar" value={m.total} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <Stat label="To'liq qamrab olingan" value={m.fullyStaffed} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger-600" />
              </div>
              <Stat label="Yetishmovchilik" value={m.understaffed.length} />
            </div>
          </Card>
        </Grid>

        <Card title="Xodim yetishmayotgan smenalar">
          {isLoading ? (
            <p className="text-sm text-text-muted py-4">Yuklanmoqda…</p>
          ) : m.understaffed.length === 0 ? (
            <p className="text-sm text-success py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Barcha smenalar to'liq qamrab olingan
            </p>
          ) : (
            <div className="space-y-2">
              {m.understaffed.map((s) => (
                <Link
                  key={s.id}
                  href={`/shifts/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-danger-600" />
                    <div>
                      <p className="text-sm text-text font-medium">{s.department.name}</p>
                      <p className="text-xs text-text-muted">
                        {fmtShiftDay(s.startAt)} · {fmtShiftRange(s.startAt, s.endAt)}
                      </p>
                    </div>
                  </div>
                  <StaffingBadge staffing={s.staffing} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </PageContent>
    </>
  );
}
