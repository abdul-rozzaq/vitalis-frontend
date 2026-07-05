"use client"

import React, { useMemo } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { Sidebar } from '../sidebar/Sidebar';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TimelineGrid } from '../timeline/TimelineGrid';
import { TimelineCanvas } from '../timeline/TimelineCanvas';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { mockDepartments, mockShifts } from '../utils/mockRepository';
import { mapShiftToTimelineItem } from '../adapters/shiftAdapter';
import { TimelineRow } from '../timeline/types';
import { useTimelineEngine } from '../timeline/engine/useTimelineEngine';
import { BoardProvider, useBoardContext } from './BoardContext';
import { useKeyboardNavigation } from '../timeline/engine/useKeyboardNavigation';

const BoardContent: React.FC = () => {
  const { config, timelineStart } = useBoardContext();

  const rows: TimelineRow[] = useMemo(() => 
    mockDepartments.map(dept => ({
      id: dept.id,
      title: dept.name,
      height: 60 // tighter enterprise row height
    })), 
  []);

  const items = useMemo(() => 
    mockShifts.map(mapShiftToTimelineItem), 
  []);

  // 2. Timeline Engine Processing
  const { positionedRows, positionedItems, totalWidth } = useTimelineEngine({
    items,
    rows,
    timelineStart,
    config
  });

  // 3. Keyboard Navigation Integration
  useKeyboardNavigation(positionedItems);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-text font-sans overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <TimelineCanvas 
          sidebar={<Sidebar rows={positionedRows} />}
          header={<TimelineHeader />}
          grid={<TimelineGrid positionedItems={positionedItems} positionedRows={positionedRows} totalWidth={totalWidth} />}
        />
        <InspectorPanel />
      </div>
    </div>
  );
};

export const BoardLayout: React.FC = () => {
  return (
    <BoardProvider>
      <BoardContent />
    </BoardProvider>
  );
};
