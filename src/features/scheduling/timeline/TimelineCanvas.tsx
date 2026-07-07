import React from 'react';
import { TimelineViewport } from './TimelineViewport';

interface TimelineCanvasProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  grid: React.ReactNode;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ header, sidebar, grid }) => {
  return (
    <div className="flex flex-1 overflow-hidden bg-surface">
      <div className="w-64 flex-shrink-0 border-r border-border bg-surface-secondary flex flex-col z-20">
        {sidebar}
      </div>
      <TimelineViewport>
        <div className="sticky top-0 z-10 bg-surface min-w-max shadow-sm">
          {header}
        </div>
        <div className="flex-1 relative min-w-max bg-surface">
          {grid}
        </div>
      </TimelineViewport>
    </div>
  );
};
