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
    content: (width: number) => (
      <ShiftCard 
        id={shift.id}
        name={shift.name}
        timeRange={timeRange}
        status={shift.status}
        width={width}
      />
    ),
  };
};
