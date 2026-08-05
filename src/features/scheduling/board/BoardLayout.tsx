"use client"

import React, { useMemo, useState } from 'react';
import { useBoardShifts, useDepartments } from '../api';
import { mapShiftToTimelineItem } from '../adapters/shiftAdapter';
import { AssignStaffModal } from '../components/AssignStaffModal';
import { BulkAssignModal } from '../components/BulkAssignModal';
import { GenerateShiftsModal } from '../components/GenerateShiftsModal';
import { ShiftCrudModal } from '../components/ShiftCrudModal';
import { ShiftTemplatesModal } from '../components/ShiftTemplatesModal';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { Sidebar } from '../sidebar/Sidebar';
import { TimelineCanvas } from '../timeline/TimelineCanvas';
import { useKeyboardNavigation } from '../timeline/engine/useKeyboardNavigation';
import { useTimelineEngine } from '../timeline/engine/useTimelineEngine';
import { TimelineGrid } from '../timeline/TimelineGrid';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TimelineRow } from '../timeline/types';
import { Toolbar } from '../toolbar/Toolbar';
import { BoardProvider, useBoardContext } from './BoardContext';

/**
 * Board bir marta qancha kunlik ma'lumot tortadi.
 * Avval 365 kun edi — bulk generatsiyadan keyin bunday javob juda kattalashadi.
 */
const BOARD_WINDOW_DAYS = 60;

type ActiveModal = 'shift' | 'generate' | 'bulkAssign' | 'templates' | 'assignStaff' | null;

const BoardContent: React.FC = () => {
  const { config, timelineStart, selectedItemIds } = useBoardContext();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);

  const timelineEnd = useMemo(() => {
    const end = new Date(timelineStart);
    end.setDate(end.getDate() + BOARD_WINDOW_DAYS);
    return end.toISOString();
  }, [timelineStart]);

  const { data: departments = [], isLoading: isLoadingDepts } = useDepartments();
  const { data: shifts = [], isLoading: isLoadingShifts } = useBoardShifts(
    timelineStart.toISOString(),
    timelineEnd
  );

  const rows: TimelineRow[] = useMemo(() =>
    departments.map((dept) => ({
      id: dept.id,
      title: dept.name,
      height: 60
    })),
  [departments]);

  const items = useMemo(() => shifts.map(mapShiftToTimelineItem), [shifts]);

  const { positionedRows, positionedItems, totalWidth } = useTimelineEngine({
    items,
    rows,
    timelineStart,
    config
  });

  useKeyboardNavigation(positionedItems);

  const closeModal = () => setActiveModal(null);

  const openCreate = () => {
    setEditingShiftId(null);
    setActiveModal('shift');
  };

  const openEdit = (id: string) => {
    setEditingShiftId(id);
    setActiveModal('shift');
  };

  const openAssignStaff = (id: string) => {
    setAssigningShiftId(id);
    setActiveModal('assignStaff');
  };

  if (isLoadingDepts || isLoadingShifts) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-text">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-text-muted">Jadval yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const shiftToEdit = editingShiftId ? shifts.find((s) => s.id === editingShiftId) ?? null : null;

  return (
    <div className="h-screen w-full flex flex-col bg-background text-text font-sans overflow-hidden">
      <Toolbar
        onCreateClick={openCreate}
        onGenerateClick={() => setActiveModal('generate')}
        onBulkAssignClick={() => setActiveModal('bulkAssign')}
        onTemplatesClick={() => setActiveModal('templates')}
      />
      <div className="flex flex-1 overflow-hidden">
        <TimelineCanvas
          sidebar={<Sidebar rows={positionedRows} />}
          header={<TimelineHeader />}
          grid={<TimelineGrid positionedItems={positionedItems} positionedRows={positionedRows} totalWidth={totalWidth} />}
        />
        <InspectorPanel
          windowDays={BOARD_WINDOW_DAYS}
          onEditClick={() => selectedItemIds[0] && openEdit(selectedItemIds[0])}
          onAssignClick={openAssignStaff}
        />
      </div>

      <ShiftCrudModal isOpen={activeModal === 'shift'} onClose={closeModal} shiftToEdit={shiftToEdit} />
      <GenerateShiftsModal isOpen={activeModal === 'generate'} onClose={closeModal} />
      {/*
        Shartli mount — panel yopilganda holati (tanlangan smenalar, xodimlar,
        preview) o'z-o'zidan tozalanadi, `useEffect` bilan reset qilish shart emas.
      */}
      {activeModal === 'bulkAssign' && (
        <BulkAssignModal isOpen onClose={closeModal} shifts={shifts} />
      )}
      <ShiftTemplatesModal isOpen={activeModal === 'templates'} onClose={closeModal} />
      <AssignStaffModal isOpen={activeModal === 'assignStaff'} onClose={closeModal} shiftId={assigningShiftId} />
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
