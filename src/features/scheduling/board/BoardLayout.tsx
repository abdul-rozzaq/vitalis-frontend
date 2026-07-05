"use client"

import React, { useMemo, useState } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { Sidebar } from '../sidebar/Sidebar';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TimelineGrid } from '../timeline/TimelineGrid';
import { TimelineCanvas } from '../timeline/TimelineCanvas';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { useDepartments, useBoardShifts } from '../api';
import { mapShiftToTimelineItem } from '../adapters/shiftAdapter';
import { TimelineRow } from '../timeline/types';
import { useTimelineEngine } from '../timeline/engine/useTimelineEngine';
import { BoardProvider, useBoardContext } from './BoardContext';
import { useKeyboardNavigation } from '../timeline/engine/useKeyboardNavigation';
import { ShiftCrudModal } from '../components/ShiftCrudModal';

const BoardContent: React.FC = () => {
  const { config, timelineStart, selectedItemIds } = useBoardContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Load from API instead of mock
  const timelineEnd = useMemo(() => {
    const end = new Date(timelineStart);
    end.setDate(end.getDate() + 365); // fetch for 1 year ahead
    return end.toISOString();
  }, [timelineStart]);

  const { data: departments = [], isLoading: isLoadingDepts } = useDepartments();
  const { data: shifts = [], isLoading: isLoadingShifts } = useBoardShifts(
    timelineStart.toISOString(), 
    timelineEnd
  );

  const rows: TimelineRow[] = useMemo(() => 
    departments.map((dept: any) => ({
      id: dept.id,
      title: dept.name,
      height: 60
    })), 
  [departments]);

  const items = useMemo(() => 
    shifts.map(mapShiftToTimelineItem), 
  [shifts]);

  const { positionedRows, positionedItems, totalWidth } = useTimelineEngine({
    items,
    rows,
    timelineStart,
    config
  });

  useKeyboardNavigation(positionedItems);

  // Helper to open modal
  const handleOpenCreateModal = () => {
    setEditingShiftId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (id: string) => {
    setEditingShiftId(id);
    setIsModalOpen(true);
  };

  if (isLoadingDepts || isLoadingShifts) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-text">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-text-muted">Loading schedule...</p>
        </div>
      </div>
    );
  }

  const shiftToEdit = editingShiftId ? shifts.find((s: any) => s.id === editingShiftId) : null;

  return (
    <div className="h-screen w-full flex flex-col bg-background text-text font-sans overflow-hidden">
      <Toolbar onCreateClick={handleOpenCreateModal} />
      <div className="flex flex-1 overflow-hidden">
        <TimelineCanvas 
          sidebar={<Sidebar rows={positionedRows} />}
          header={<TimelineHeader />}
          grid={<TimelineGrid positionedItems={positionedItems} positionedRows={positionedRows} totalWidth={totalWidth} />}
        />
        <InspectorPanel onEditClick={() => selectedItemIds[0] && handleOpenEditModal(selectedItemIds[0])} />
      </div>
      
      <ShiftCrudModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        shiftToEdit={shiftToEdit} 
      />
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
