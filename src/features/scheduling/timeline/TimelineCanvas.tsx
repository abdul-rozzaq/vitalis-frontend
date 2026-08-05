import React from 'react';
import { TimelineViewport } from './TimelineViewport';

interface TimelineCanvasProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  grid: React.ReactNode;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ header, sidebar, grid }) => {
  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <div className="w-64 flex-shrink-0 border-r border-border bg-surface flex flex-col z-20">
        {sidebar}
      </div>
      <TimelineViewport>
        {/*
          Header o'zining `border-b` si bilan ajraladi — bu yerda qo'shimcha
          `shadow-sm` yo'q, aks holda toolbar chizig'i bilan qo'sh chiziq
          hosil bo'lardi.
        */}
        <div className="sticky top-0 z-10 bg-surface min-w-max">
          {header}
        </div>
        {/*
          Kanvas fon rangi — `bg-background`. Kartalar `bg-surface` (oq),
          shuning uchun ular ramkasiz ham fondan ajralib turadi.
        */}
        <div className="flex-1 relative min-w-max bg-background">
          {grid}
        </div>
      </TimelineViewport>
    </div>
  );
};
