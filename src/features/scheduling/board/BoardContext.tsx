"use client"

import React, { createContext, useContext, useState, useMemo } from 'react';
import { TimelineConfig } from '../timeline/types';
import { createTimelineConfig } from '../timeline/config';

interface BoardState {
  config: TimelineConfig;
  setConfig: (config: TimelineConfig | ((prev: TimelineConfig) => TimelineConfig)) => void;
  timelineStart: Date;
  setTimelineStart: (date: Date) => void;
  viewportX: number;
  setViewportX: (x: number) => void;
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
  viewportElement: HTMLDivElement | null;
  setViewportElement: (el: HTMLDivElement | null) => void;
}

const BoardContext = createContext<BoardState | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TimelineConfig>(createTimelineConfig());
  
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [viewportX, setViewportX] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);

  const value = useMemo(() => ({
    config,
    setConfig,
    timelineStart,
    setTimelineStart,
    viewportX,
    setViewportX,
    selectedItemIds,
    setSelectedItemIds,
    hoveredItemId,
    setHoveredItemId,
    viewportElement,
    setViewportElement
  }), [config, timelineStart, viewportX, selectedItemIds, hoveredItemId, viewportElement]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};
