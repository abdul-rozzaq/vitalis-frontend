import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBoardContext } from '../board/BoardContext';
import { TimelineRow } from '../timeline/types';

interface SidebarProps {
  rows: TimelineRow[];
}

export const Sidebar: React.FC<SidebarProps> = ({ rows }) => {
  const { viewportElement } = useBoardContext();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportElement,
    estimateSize: (index) => rows[index].height,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      <div className="h-12 px-4 font-semibold border-b border-border text-text flex items-center text-sm z-10 bg-surface-secondary">
        Departments
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div 
                key={row.id} 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="px-4 border-b border-border-light hover:bg-surface-hover cursor-pointer transition-colors text-xs font-semibold text-text-secondary flex items-center bg-surface-secondary"
              >
                {row.title}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
