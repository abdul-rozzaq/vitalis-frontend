"use client"

import React, { useRef, useEffect } from 'react';
import { useBoardContext } from '../board/BoardContext';

interface TimelineViewportProps {
  children: React.ReactNode;
}

export const TimelineViewport: React.FC<TimelineViewportProps> = ({ children }) => {
  const { setViewportX } = useBoardContext();
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (viewportRef.current) {
      setViewportX(viewportRef.current.scrollLeft);
    }
  };

  return (
    <div 
      ref={viewportRef}
      className="flex-1 flex flex-col overflow-x-auto bg-surface relative will-change-scroll pl-4 pr-4"
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
};
