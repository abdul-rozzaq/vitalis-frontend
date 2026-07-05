export interface TimelineConfig {
  dayColumnWidth: number;
  zoomLevel: number; // e.g. 100 for 100%
  snapIntervalMinutes: number; // e.g. 15 for 15-min snapping during drag & drop
  pixelsPerHour: number; // Derived dynamically
}

export interface TimelineRow {
  id: string;
  title: string;
  height: number;
}

export interface TimelineItem {
  id: string;
  type: string; // e.g., 'shift', 'appointment', 'maintenance'
  startAt: Date;
  endAt: Date;
  rowId: string;
  content: (width: number) => React.ReactNode;
}

// --- Engine Output Types ---

export interface PositionedRow {
  id: string;
  title: string;
  y: number;
  height: number;
}

export interface PositionedItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: React.ReactNode;
}
