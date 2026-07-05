/**
 * Generic mathematics for placing items onto a continuous time-based axis.
 * The timeline engine knows nothing about the actual dates, only about pixels and diffs.
 */

export const getPixelsPerHour = (dayColumnWidth: number): number => {
  return dayColumnWidth / 24;
};

export const calculateItemX = (
  itemStart: Date,
  timelineStart: Date,
  pixelsPerHour: number
): number => {
  const diffMs = itemStart.getTime() - timelineStart.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours * pixelsPerHour;
};

export const calculateItemWidth = (
  itemStart: Date,
  itemEnd: Date,
  pixelsPerHour: number
): number => {
  const diffMs = itemEnd.getTime() - itemStart.getTime();
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
  return diffHours * pixelsPerHour;
};

export const calculateRowTop = (
  rowId: string,
  rows: { id: string; height: number }[]
): number => {
  let top = 0;
  for (const row of rows) {
    if (row.id === rowId) break;
    top += row.height;
  }
  return top;
};
