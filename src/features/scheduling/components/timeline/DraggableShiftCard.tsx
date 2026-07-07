"use client";
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ShiftCard } from './ShiftCard';
import { ShiftAssignment } from '../../types';

interface DraggableShiftCardProps {
  id: string;
  assignment: ShiftAssignment | null;
  startAt: Date;
  endAt: Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  onClick?: () => void;
}

export const DraggableShiftCard: React.FC<DraggableShiftCardProps> = ({ 
  id, 
  assignment, 
  startAt, 
  endAt, 
  status,
  onClick 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { assignment, startAt, endAt },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ShiftCard 
        assignment={assignment} 
        startAt={startAt} 
        endAt={endAt} 
        status={status} 
        onClick={onClick}
      />
    </div>
  );
};
