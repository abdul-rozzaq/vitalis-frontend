import { useMemo } from 'react';
import { TimelineItem, TimelineRow, TimelineConfig } from '../types';
import { TimelineEngine } from './TimelineEngine';

interface UseTimelineEngineProps {
  items: TimelineItem[];
  rows: TimelineRow[];
  timelineStart: Date;
  config: TimelineConfig;
  itemHeight?: number;
}

/**
 * Thin React wrapper around the pure TimelineEngine class.
 * Memoizes results so React only re-renders when data or config changes.
 */
export const useTimelineEngine = ({ 
  items, 
  rows, 
  timelineStart, 
  config,
  itemHeight = 48
}: UseTimelineEngineProps) => {
  
  const engine = useMemo(() => new TimelineEngine(config), [config]);

  const positionedRows = useMemo(() => {
    return engine.processRows(rows);
  }, [engine, rows]);

  const positionedItems = useMemo(() => {
    return engine.processItems(items, positionedRows, timelineStart, itemHeight);
  }, [engine, items, positionedRows, timelineStart, itemHeight]);

  return { 
    positionedRows, 
    positionedItems, 
    totalWidth: config.dayColumnWidth * 365, // 1 year timeline
    daysCount: 365
  };
};
