export interface TimelineRow {
  id: string;
  title: string;
  height: number; // For elastic rows later, for now we can use a fixed default
}

export interface TimelineItem {
  id: string;
  startAt: Date;
  endAt: Date;
  rowId: string; // E.g., Department ID
  content: (width: number) => React.ReactNode;
}
