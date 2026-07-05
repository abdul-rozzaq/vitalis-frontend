"use client"

import React, { useRef, useEffect } from 'react';
import { useBoardContext } from '../board/BoardContext';

interface TimelineViewportProps {
  children: React.ReactNode;
}

export const TimelineViewport: React.FC<TimelineViewportProps> = ({ children }) => {
  const { setViewportX, viewportElement, setViewportElement } = useBoardContext();

  const handleScroll = () => {
    if (viewportElement) {
      setViewportX(viewportElement.scrollLeft);
    }
  };

  return (
    <div 
      ref={setViewportElement}
      className="flex-1 flex flex-col overflow-auto bg-surface relative will-change-scroll"
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
};
