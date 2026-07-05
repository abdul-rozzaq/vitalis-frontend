import React from 'react';
import { TimelineItem, TimelineRow } from './types';
import { calculateItemWidth, calculateItemX, calculateRowTop, getPixelsPerHour } from './utils/timelineMath';

interface TimelineGridProps {
  items: TimelineItem[];
  rows: TimelineRow[];
  timelineStart: Date;
  dayColumnWidth?: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  items, 
  rows, 
  timelineStart,
  dayColumnWidth = 600 
}) => {
  const pixelsPerHour = getPixelsPerHour(dayColumnWidth);
  const totalWidth = dayColumnWidth * 7; // Ensure the grid stretches fully to match the header (7 days)

  return (
    <div className="relative h-full min-h-[500px]" style={{ width: `${totalWidth}px` }}>
      {/* Render Dynamic Row Dividers */}
      {rows.map((row) => {
        const top = calculateRowTop(row.id, rows);
        return (
          <div 
            key={row.id}
            className="absolute w-full border-b border-gray-100 dark:border-gray-800/50"
            style={{ top: `${top + row.height}px`, height: '1px' }} 
          />
        );
      })}

      {/* Render Dynamic Timeline Items */}
      {items.map((item) => {
        const top = calculateRowTop(item.rowId, rows);
        const left = calculateItemX(item.startAt, timelineStart, pixelsPerHour);
        const width = calculateItemWidth(item.startAt, item.endAt, pixelsPerHour);
        
        // Vertically center the item inside its row
        const rowHeight = rows.find(r => r.id === item.rowId)?.height || 60;
        const itemHeight = 48; // Tighter enterprise card height
        const offsetTop = top + (rowHeight - itemHeight) / 2;

        return (
          <div 
            key={item.id}
            className="absolute"
            style={{ 
              top: `${offsetTop}px`, 
              left: `${left}px`, 
              width: `${width}px`,
              height: `${itemHeight}px`
            }}
          >
            {item.content(width)}
          </div>
        );
      })}
    </div>
  );
};
