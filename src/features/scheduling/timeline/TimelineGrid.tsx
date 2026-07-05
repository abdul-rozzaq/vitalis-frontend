import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBoardContext } from '../board/BoardContext';
import { PositionedItem, PositionedRow } from './types';

interface TimelineGridProps {
  positionedItems: PositionedItem[];
  positionedRows: PositionedRow[];
  totalWidth: number;
  daysCount?: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  positionedItems, 
  positionedRows, 
  totalWidth,
  daysCount = 365
}) => {
  const { viewportElement, config } = useBoardContext();

  const rowVirtualizer = useVirtualizer({
    count: positionedRows.length,
    getScrollElement: () => viewportElement,
    estimateSize: (index) => positionedRows[index].height,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: daysCount,
    getScrollElement: () => viewportElement,
    estimateSize: () => config.dayColumnWidth,
    overscan: 2,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const virtualColumns = columnVirtualizer.getVirtualItems();

  // Find the current vertical visibility range
  const rangeStartY = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const rangeEndY = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].end : 0;

  // Find the current horizontal visibility range
  const rangeStartX = virtualColumns.length > 0 ? virtualColumns[0].start : 0;
  const rangeEndX = virtualColumns.length > 0 ? virtualColumns[virtualColumns.length - 1].end : 0;

  // Only render items that intersect with both vertical and horizontal view
  const visibleItems = positionedItems.filter(item => 
    item.y + item.height >= rangeStartY && item.y <= rangeEndY &&
    item.x + item.width >= rangeStartX && item.x <= rangeEndX
  );

  return (
    <div className="relative" style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}>
      {/* Render Dynamic Row Dividers */}
      {virtualRows.map((virtualRow) => {
        const row = positionedRows[virtualRow.index];
        return (
          <div 
            key={row.id}
            className="absolute w-full border-b border-border-light"
            style={{ 
              top: `${virtualRow.start}px`, 
              height: `${virtualRow.size}px` 
            }} 
          />
        );
      })}

      {/* Render Virtualized Timeline Items */}
      {visibleItems.map((item) => (
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
