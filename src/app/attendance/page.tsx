"use client";

import { useAttendanceRecords, useAttendanceEvents } from "@/features/attendance/hooks/use-attendance";
import { AttendanceStatsCards } from "@/features/attendance/components/attendance-stats-cards";
import { AttendanceTable } from "@/features/attendance/components/attendance-table";
import { AttendanceEventsTable } from "@/features/attendance/components/attendance-events-table";
import { format } from "date-fns";
import { useState } from "react";
import { Calendar, Search, ListFilter, Activity } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layouts/PageLayout";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"records" | "events">("records");
  const [date, setDate] = useState<string>("");

  const { data: records, isLoading: recordsLoading } = useAttendanceRecords(date ? { date } : undefined);
  const { data: events, isLoading: eventsLoading } = useAttendanceEvents(date ? { from: date, to: date } : undefined);

  const isLoading = activeTab === "records" ? recordsLoading : eventsLoading;

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

        <div className="flex items-center gap-2 border-b border-border pb-px mt-6">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "records"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-secondary hover:text-text hover:border-border"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Davomat hisoboti
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "events"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-secondary hover:text-text hover:border-border"
            }`}
          >
            <Activity className="w-4 h-4" />
            Barcha skanerlashlar
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse mt-6">
            {activeTab === "records" && <div className="h-28 bg-surface-hover rounded-xl"></div>}
            <div className="h-64 bg-surface-hover rounded-xl"></div>
          </div>
        ) : activeTab === "records" ? (
          records ? (
            <div className="space-y-6 mt-6">
              <AttendanceStatsCards records={records} />
              <AttendanceTable records={records} />
            </div>
          ) : (
            <div className="text-center text-secondary py-12">Ma'lumot topilmadi</div>
          )
        ) : (
          events ? (
            <div className="mt-6">
              <AttendanceEventsTable events={events} />
            </div>
          ) : (
            <div className="text-center text-secondary py-12">Skanerlash yozuvlari topilmadi</div>
          )
        )}
      </PageContent>
    </div>
  );
}
