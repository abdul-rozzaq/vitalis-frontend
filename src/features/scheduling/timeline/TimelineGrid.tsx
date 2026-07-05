import React from 'react';
import { PositionedItem, PositionedRow } from './types';

interface TimelineGridProps {
  positionedItems: PositionedItem[];
  positionedRows: PositionedRow[];
  totalWidth: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  positionedItems, 
  positionedRows, 
  totalWidth
}) => {
  return (
    <div className="relative h-full min-h-[500px]" style={{ width: `${totalWidth}px` }}>
      {/* Render Dynamic Row Dividers */}
      {positionedRows.map((row) => (
        <div 
          key={row.id}
          className="absolute w-full border-b border-border-light"
          style={{ top: `${row.y + row.height}px`, height: '1px' }} 
        />
      ))}

      {/* Render Pre-Calculated Timeline Items */}
      {positionedItems.map((item) => (
        <div 
          key={item.id}
          className="absolute"
          style={{ 
            top: `${item.y}px`, 
            left: `${item.x}px`, 
            width: `${item.width}px`,
            height: `${item.height}px`
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
