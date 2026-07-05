import React from 'react';
import { TimelineItem, TimelineRow } from './types';

interface TimelineCanvasProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  grid: React.ReactNode;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ header, sidebar, grid }) => {
  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col z-20">
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col overflow-x-auto relative pl-4">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 min-w-max">
          {header}
        </div>
        <div className="flex-1 relative min-w-max bg-[url('/grid-pattern.svg')] dark:bg-[url('/grid-pattern-dark.svg')]">
          {grid}
        </div>
      </div>
    </div>
  );
};
