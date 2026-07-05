import React from 'react';
import { TimelineRow } from '../timeline/types';

interface SidebarProps {
  rows: TimelineRow[];
}

export const Sidebar: React.FC<SidebarProps> = ({ rows }) => {
  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      <div className="h-10 px-4 font-semibold border-b border-border text-text flex items-center text-sm">
        Departments
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => (
          <div 
            key={row.id} 
            style={{ height: `${row.height}px` }}
            className="px-4 border-b border-border-light hover:bg-surface-hover cursor-pointer transition-colors text-xs font-semibold text-text-secondary flex items-center"
          >
            {row.title}
          </div>
        ))}
      </div>
    </div>
  );
};
