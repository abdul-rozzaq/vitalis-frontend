"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { LiveBoard } from "@/features/attendance/components/live-board";
import { MonthlyGrid } from "@/features/attendance/components/monthly-grid";
import { UnresolvedQueue } from "@/features/attendance/components/unresolved-queue";
import {
  useAttendanceRecords,
  useLiveShifts,
  useUnresolved,
} from "@/features/attendance/hooks/use-attendance";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { AlertTriangle, CalendarRange, Radio } from "lucide-react";
import { useState } from "react";

type Tab = "live" | "monthly" | "unresolved";

export default function AttendanceLivePage() {
  const [tab, setTab] = useState<Tab>("live");
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const { data: shifts = [], isLoading: shiftsLoading, dataUpdatedAt } = useLiveShifts();

  const monthStart = format(startOfMonth(new Date(`${month}-01T00:00:00`)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(`${month}-01T00:00:00`)), "yyyy-MM-dd");

  const { data: records = [], isLoading: recordsLoading } = useAttendanceRecords({
    from: monthStart,
    to: monthEnd,
  });

  const { data: unresolved } = useUnresolved();
  // Hisoblagich guruhlangan ISHLAR sonini ko'rsatadi, skanlar sonini emas.
  const pendingCount = unresolved
    ? unresolved.totals.unknownEmployees + unresolved.totals.noShift + unresolved.totals.records
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kim ishda"
        subtitle="Smenaga biriktirilgan xodimlar va Face ID terminalidan kelayotgan haqiqiy davomat"
      />

      <PageContent>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-px">
          <div className="flex items-center gap-2">
            <TabButton active={tab === "live"} onClick={() => setTab("live")} icon={<Radio className="w-4 h-4" />}>
              Hozir
            </TabButton>
            <TabButton
              active={tab === "monthly"}
              onClick={() => setTab("monthly")}
              icon={<CalendarRange className="w-4 h-4" />}
            >
              Oylik jadval
            </TabButton>
            <TabButton
              active={tab === "unresolved"}
              onClick={() => setTab("unresolved")}
              icon={<AlertTriangle className="w-4 h-4" />}
              badge={pendingCount}
            >
              Hal qilinmagan
            </TabButton>
          </div>

          {tab !== "monthly" ? (
            <p className="text-xs text-text-muted pb-2 tabular-nums">
              {tab === "live" && dataUpdatedAt
                ? `Yangilandi ${format(new Date(dataUpdatedAt), "HH:mm:ss")}`
                : ""}
              <span className="text-text-muted/60"> · har 30 soniyada</span>
            </p>
          ) : (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mb-2 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          )}
        </div>

        <div className="mt-6">
          {tab === "live" && <LiveBoard shifts={shifts} isLoading={shiftsLoading} />}
          {tab === "monthly" && (
            <MonthlyGrid records={records} month={month} isLoading={recordsLoading} />
          )}
          {tab === "unresolved" && <UnresolvedQueue />}
        </div>
      </PageContent>
    </div>
  );
}

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** Noldan katta bo'lsa tab yonida qizil hisoblagich chiqadi. */
  badge?: number;
}> = ({ active, onClick, icon, children, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-secondary hover:text-text hover:border-border"
    }`}
  >
    {icon}
    {children}
    {!!badge && (
      <span className="bg-danger text-white text-[11px] font-semibold rounded-full px-1.5 min-w-5 text-center tabular-nums">
        {badge}
      </span>
    )}
  </button>
);
