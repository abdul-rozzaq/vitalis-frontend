"use client";
import React from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { TimelineProvider } from "./TimelineContext";
import { TimelineView } from "./TimelineView";
import { useUpdateAssignment, useUpdateShift } from "../../api";

interface TimelineProps {
  initialDate?: Date;
}

export const Timeline: React.FC<TimelineProps> = ({ initialDate }) => {
  const updateShift = useUpdateShift();
  const updateAssignment = useUpdateAssignment();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // In a real scenario, we'd parse the over.id to figure out which swimlane (user)
      // or what time offset it dropped on.
      // E.g. over.id might be `swimlane-staff-3` or `timecell-0800`
      console.log("Drag ended", active.id, "over", over.id);

      // Example assignment update logic:
      // updateAssignment.mutate({ id: String(active.id), data: { userId: ... } });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <TimelineProvider initialDate={initialDate}>
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <TimelineView />
        </div>
      </TimelineProvider>
    </DndContext>
  );
};
