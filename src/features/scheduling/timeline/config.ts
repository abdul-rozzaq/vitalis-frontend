import { TimelineConfig } from './types';

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  dayColumnWidth: 600,
  zoomLevel: 100,
  snapIntervalMinutes: 15,
  pixelsPerHour: 600 / 24, // 25
};

export const createTimelineConfig = (overrides?: Partial<TimelineConfig>): TimelineConfig => {
  const dayColumnWidth = overrides?.dayColumnWidth ?? DEFAULT_TIMELINE_CONFIG.dayColumnWidth;
  return {
    ...DEFAULT_TIMELINE_CONFIG,
    ...overrides,
    dayColumnWidth,
    pixelsPerHour: dayColumnWidth / 24,
  };
};
