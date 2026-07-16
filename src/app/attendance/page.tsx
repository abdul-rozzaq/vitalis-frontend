"use client";

import { useAttendanceRecords } from "@/features/attendance/hooks/use-attendance";
import { AttendanceStatsCards } from "@/features/attendance/components/attendance-stats-cards";
import { AttendanceTable } from "@/features/attendance/components/attendance-table";
import { format } from "date-fns";
import { useState } from "react";
import { Calendar, Search } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layouts/PageLayout";

export default function AttendancePage() {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const { data: records, isLoading } = useAttendanceRecords({ date });

  return (
    <div className="space-y-6">
      <PageHeader title="Davomat Nazorati" subtitle="Xodimlar davomatini monitoring qilish va hisobotlar" />

      <PageContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full sm:w-auto">
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              <Calendar className="w-4 h-4" />
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-auto bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text"
            />
          </div>
          <div className="relative flex-1 w-full">
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              <Search className="w-4 h-4" />
            </label>
            <input
              type="text"
              placeholder="Xodimni qidirish..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-surface-hover rounded-xl"></div>
            <div className="h-64 bg-surface-hover rounded-xl"></div>
          </div>
        ) : records ? (
          <>
            <AttendanceStatsCards records={records} />
            <AttendanceTable records={records} />
          </>
        ) : (
          <div className="text-center text-secondary py-12">Ma'lumot topilmadi</div>
        )}
      </PageContent>
    </div>
  );
}
