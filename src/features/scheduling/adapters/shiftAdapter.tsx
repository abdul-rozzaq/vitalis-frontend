import React from 'react';
import { TimelineItem } from '../timeline/types';
import { ShiftCard } from '../shift-card/ShiftCard';
import { format } from 'date-fns';

/**
 * Maps a domain-specific Shift entity to a generic TimelineItem.
 * This ensures the Timeline Engine remains completely unaware of hospital logic.
 */
export const mapShiftToTimelineItem = (shift: any): TimelineItem => {
  const timeRange = `${format(new Date(shift.startAt), 'HH:mm')} - ${format(new Date(shift.endAt), 'HH:mm')}`;

  return {
    id: shift.id,
    type: 'shift', // Generic identity support
    startAt: new Date(shift.startAt),
    endAt: new Date(shift.endAt),
    rowId: shift.departmentId,
    content: (width: number) => {
      // Determine coverage status based on the new backend staffing object
      const isStaffed = shift.staffing 
        ? shift.staffing.assignedDoctors >= shift.staffing.requiredDoctors && shift.staffing.assignedNurses >= shift.staffing.requiredNurses
        : shift.status === 'staffed';

      return (
        <ShiftCard 
          id={shift.id}
          name={shift.note || `${shift.department?.name || 'Department'} Shift`}
          timeRange={timeRange}
          status={isStaffed ? 'staffed' : 'understaffed'}
          width={width}
        />
      );
    },
  };
};
