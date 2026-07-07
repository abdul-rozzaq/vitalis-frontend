/**
 * Generic mathematics for converting time into screen coordinates.
 * Pure functions only. No UI logic. No side effects.
 */

export const getPixelsPerHour = (dayColumnWidth: number): number => {
  return dayColumnWidth / 24;
};

// 1. Date -> Pixel
export const dateToPixel = (date: Date, timelineStart: Date, pixelsPerHour: number): number => {
  const diffHours = (date.getTime() - timelineStart.getTime()) / 3600000;
  return diffHours * pixelsPerHour;
};

// 2. Pixel -> Date
export const pixelToDate = (pixel: number, timelineStart: Date, pixelsPerHour: number): Date => {
  const diffHours = pixel / pixelsPerHour;
  const ms = diffHours * 3600000;
  return new Date(timelineStart.getTime() + ms);
};

// 3. Duration -> Width
export const durationToWidth = (start: Date, end: Date, pixelsPerHour: number): number => {
  const diffHours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);
  return diffHours * pixelsPerHour;
};

// 4. Width -> Duration (Returns ms)
export const widthToDuration = (width: number, pixelsPerHour: number): number => {
  const hours = width / pixelsPerHour;
  return hours * 3600000;
};

