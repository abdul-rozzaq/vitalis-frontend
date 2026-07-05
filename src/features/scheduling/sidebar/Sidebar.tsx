import React from 'react';
import { TimelineRow } from '../timeline/types';

interface SidebarProps {
  rows: TimelineRow[];
}

export const Sidebar: React.FC<SidebarProps> = ({ rows }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      <div className="h-10 px-4 font-semibold border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white flex items-center text-sm">
        Departments
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => (
          <div 
            key={row.id} 
            style={{ height: `${row.height}px` }}
            className="px-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center"
          >
            {row.title}
          </div>
        ))}
      </div>
    </div>
  );
};
