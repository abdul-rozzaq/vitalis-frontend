import { fmtShiftRange, Shift } from '@/shared/lib/shifts-api';
import React from 'react';
import { ShiftCard } from '../shift-card/ShiftCard';
import { TimelineItem } from '../timeline/types';

/**
 * Domen `Shift` obyektini umumiy `TimelineItem` ga aylantiradi.
 * Timeline dvigateli klinika mantiqidan bexabar qoladi.
 */
export const mapShiftToTimelineItem = (shift: Shift): TimelineItem => {
  const timeRange = fmtShiftRange(shift.startAt, shift.endAt);

  return {
    id: shift.id,
    type: 'shift',
    startAt: new Date(shift.startAt),
    endAt: new Date(shift.endAt),
    rowId: shift.departmentId,
    content: (width: number) => (
      <ShiftCard
        id={shift.id}
        // Qator allaqachon bo'lim nomi — kartada uni takrorlash ortiqcha.
        name={shift.note || 'Smena'}
        timeRange={timeRange}
        staffing={shift.staffing}
        attendance={shift.attendance}
        width={width}
      />
    ),
  };
};
