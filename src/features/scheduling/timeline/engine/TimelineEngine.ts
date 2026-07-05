import { TimelineItem, TimelineRow, PositionedItem, PositionedRow, TimelineConfig } from '../types';
import { dateToPixel, durationToWidth } from '../utils/timelineMath';

/**
 * Pure Framework-Independent Timeline Engine
 * 
 * Processes any array of TimelineItems (shifts, appointments, maintenance)
 * into absolute pixel coordinates.
 */
export class TimelineEngine {
  public config: TimelineConfig;

  constructor(config: TimelineConfig) {
    this.config = config;
  }

  public processRows(rows: TimelineRow[]): PositionedRow[] {
    let currentY = 0;
    return rows.map(row => {
      const posRow: PositionedRow = {
        id: row.id,
        title: row.title,
        y: currentY,
        height: row.height,
      };
      currentY += row.height;
      return posRow;
    });
  }

  public processItems(
    items: TimelineItem[], 
    positionedRows: PositionedRow[], 
    timelineStart: Date,
    itemHeight: number = 48
  ): PositionedItem[] {
    const pixelsPerHour = this.config.dayColumnWidth / 24;

    return items.map(item => {
      const row = positionedRows.find(r => r.id === item.rowId);
      const rowY = row ? row.y : 0;
      const rowHeight = row ? row.height : 60;
      
      const x = dateToPixel(item.startAt, timelineStart, pixelsPerHour);
      const width = durationToWidth(item.startAt, item.endAt, pixelsPerHour);
      
      // Vertically center the item inside its row
      const y = rowY + (rowHeight - itemHeight) / 2;

      return {
        id: item.id,
        x,
        y,
        width,
        height: itemHeight,
        content: item.content(width),
      };
    });
  }
}
