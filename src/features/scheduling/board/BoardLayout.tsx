import React, { useMemo } from "react";
import { Toolbar } from "../toolbar/Toolbar";
import { Sidebar } from "../sidebar/Sidebar";
import { TimelineHeader } from "../timeline/TimelineHeader";
import { TimelineGrid } from "../timeline/TimelineGrid";
import { TimelineCanvas } from "../timeline/TimelineCanvas";
import { InspectorPanel } from "../inspector/InspectorPanel";
import { mockDepartments, mockShifts } from "../utils/mockRepository";
import { mapShiftToTimelineItem } from "../adapters/shiftAdapter";
import { TimelineRow } from "../timeline/types";

export const BoardLayout: React.FC = () => {
  // 1. Data Pipeline
  const timelineStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const rows: TimelineRow[] = useMemo(
    () =>
      mockDepartments.map((dept) => ({
        id: dept.id,
        title: dept.name,
        height: 60, // tighter enterprise row height
      })),
    [],
  );

  const items = useMemo(() => mockShifts.map(mapShiftToTimelineItem), []);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      {/* 1. Toolbar Region */}
      <Toolbar />

      {/* 2. Main Board Region */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline Area (Sidebar + Grid) */}
        <TimelineCanvas sidebar={<Sidebar rows={rows} />} header={<TimelineHeader />} grid={<TimelineGrid items={items} rows={rows} timelineStart={timelineStart} />} />

        {/* 3. Permanent Inspector Region */}
        <InspectorPanel />
      </div>
    </div>
  );
};
