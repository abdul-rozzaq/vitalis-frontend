import { TimelineConfig } from './types';

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  dayColumnWidth: 600,
  zoomLevel: 100,
  snapIntervalMinutes: 15,
};

export const createTimelineConfig = (overrides?: Partial<TimelineConfig>): TimelineConfig => {
  const dayColumnWidth = overrides?.dayColumnWidth ?? DEFAULT_TIMELINE_CONFIG.dayColumnWidth;
  return {
    ...DEFAULT_TIMELINE_CONFIG,
    ...overrides,
    dayColumnWidth,
  };
};
