"use client";
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTimeline } from './TimelineContext';
import { format, addHours, startOfDay } from 'date-fns';
import { DraggableShiftCard } from './DraggableShiftCard';
import { AssignmentDialog } from '../dialogs';
import { useShifts, useStaffMembers } from '../../api';
import { useSchedulingStore } from '../../store';
import { ShiftAssignment, Shift } from '../../types';
import { useUpdateAssignment } from '../../api';

export const TimelineView: React.FC = () => {
  const { days } = useTimeline();
  const parentRef = useRef<HTMLDivElement>(null);
  const { selectedScheduleId } = useSchedulingStore();
  const updateAssignment = useUpdateAssignment();
  
  const [selectedAssignment, setSelectedAssignment] = React.useState<{
    assignment: ShiftAssignment;
    startAt: Date;
    endAt: Date;
  } | null>(null);

  const { data: realStaffMembers } = useStaffMembers();
  const { data: realShifts } = useShifts(selectedScheduleId);

  const staffMembers = [
    {
      id: 'unassigned',
      name: 'Biriktirilmagan Smenalar',
      role: { id: 'unassigned', name: 'Barchasi', code: 'UNASSIGNED' }
    },
    ...(realStaffMembers || [])
  ];

  // Filter shifts for a given staff and day
  const getShiftsForCell = (staffId: string, day: Date) => {
    if (!realShifts) return [];
    
    return realShifts.filter((shift: Shift) => {
      // Check if this shift occurs on this day
      const shiftStart = new Date(shift.startAt);
      const isSameDay = shiftStart.getDate() === day.getDate() && 
                        shiftStart.getMonth() === day.getMonth() && 
                        shiftStart.getFullYear() === day.getFullYear();
                        
      if (!isSameDay) return false;
      
      // Check if assigned to this staff member
      if (staffId === 'unassigned') {
        return !shift.assignments || shift.assignments.length === 0;
      }
      return shift.assignments && shift.assignments.some((a: ShiftAssignment) => a.userId === staffId);
    }).map((shift: Shift) => {
      // Format to component expected structure
      const assignment = shift.assignments?.find((a: ShiftAssignment) => a.userId === staffId);
      return {
        id: shift.id,
        assignment: assignment || null,
        startAt: new Date(shift.startAt),
        endAt: new Date(shift.endAt),
        status: shift.status
      };
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: staffMembers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96, // 96px = h-24
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef}
      className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/20 relative"
      style={{ willChange: 'transform' }}
    >
      {/* Header Row (Sticky Top) */}
      <div className="sticky top-0 z-20 flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 min-w-max">
        <div className="w-64 flex-shrink-0 sticky left-0 z-30 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 flex items-center">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Staff Members</h2>
        </div>
        
        {days.map((day, idx) => (
          <div 
            key={idx} 
            className="w-[180px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-3 text-center bg-gray-50 dark:bg-gray-900"
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {format(day, 'EEE')}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Virtualized Grid Body */}
      <div 
        style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        className="min-w-max"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const staff = staffMembers[virtualRow.index];
          return (
            <div 
              key={virtualRow.index} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-150"
            >
              {/* Sidebar Cell (Sticky Left) */}
              <div className="w-64 flex-shrink-0 sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                <div className="font-medium text-gray-900 dark:text-white">{staff.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{staff.role.name}</div>
              </div>

              {/* Grid Cells */}
              {days.map((day, idx) => {
                const shifts = getShiftsForCell(staff.id, day);
                
                return (
                  <div 
                    key={idx} 
                    className="w-[180px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800/50 relative group"
                  >
                    {/* Hover indicator for creating new shifts */}
                    <div className="absolute inset-2 rounded-lg border-2 border-dashed border-transparent group-hover:border-blue-300 dark:group-hover:border-blue-700/50 transition-colors duration-200" />
                    
                    {/* Shifts Layer */}
                    {shifts.map((shift) => (
                      <DraggableShiftCard
                        key={shift.id}
                        id={shift.id}
                        assignment={shift.assignment}
                        startAt={shift.startAt}
                        endAt={shift.endAt}
                        status={shift.status}
                        onClick={() => setSelectedAssignment({
                          assignment: shift.assignment || { shiftId: shift.id, userId: '', roleId: '' } as ShiftAssignment,
                          startAt: shift.startAt,
                          endAt: shift.endAt
                        })}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <AssignmentDialog
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment?.assignment || null}
        startAt={selectedAssignment?.startAt || null}
        endAt={selectedAssignment?.endAt || null}
        onSave={(userId) => {
          if (selectedAssignment?.assignment) {
            updateAssignment.mutate({
              id: selectedAssignment.assignment.shiftId,
              data: { userId, roleId: selectedAssignment.assignment.roleId }
            });
          }
          setSelectedAssignment(null);
        }}
      />
    </div>
  );
};
