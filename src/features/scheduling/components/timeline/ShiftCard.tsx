import React from 'react';
import { ShiftAssignment } from '../../types';
import { format, differenceInMinutes, parseISO, startOfDay } from 'date-fns';

interface ShiftCardProps {
  assignment: ShiftAssignment | null;
  startAt: Date;
  endAt: Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  onClick?: () => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ assignment, startAt, endAt, status, onClick }) => {
  // Calculate width and position based on time
  const dayStart = startOfDay(startAt);
  const minutesFromStart = differenceInMinutes(startAt, dayStart);
  const durationMinutes = differenceInMinutes(endAt, startAt);
  
  // 180px is full day. 1440 minutes in a day.
  const pixelsPerMinute = 180 / 1440;
  const leftPosition = minutesFromStart * pixelsPerMinute;
  const width = durationMinutes * pixelsPerMinute;

  // Colors based on status
  const statusColors = {
    SCHEDULED: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    ACTIVE: 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    COMPLETED: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    CANCELLED: 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 line-through',
  };

  return (
    <div
      onClick={onClick}
      style={{
        left: `${leftPosition}px`,
        width: `${width}px`,
      }}
      className={`absolute top-2 bottom-2 rounded-md border text-xs p-1 shadow-sm overflow-hidden flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow duration-200 ${statusColors[status]}`}
    >
      {/* Left Resize Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        onClick={(e) => e.stopPropagation()} // Prevent opening dialog when resizing
      />

      <div className="font-semibold truncate px-2 pointer-events-none">
        {format(startAt, 'HH:mm')} - {format(endAt, 'HH:mm')}
      </div>
      <div className="truncate opacity-80 mt-0.5 px-2 pointer-events-none">
        {assignment ? (assignment.role?.name || assignment.roleId) : 'Biriktirilmagan'}
      </div>

      {/* Right Resize Handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
