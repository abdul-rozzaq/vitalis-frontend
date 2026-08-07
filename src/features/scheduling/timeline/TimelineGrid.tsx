import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBoardContext } from '../board/BoardContext';
import { PositionedItem, PositionedRow } from './types';

interface TimelineGridProps {
  positionedItems: PositionedItem[];
  positionedRows: PositionedRow[];
  totalWidth: number;
  daysCount?: number;
}

/** "Hozir" chizig'i shu davriylikda qayta hisoblanadi. */
const NOW_TICK_MS = 60_000;

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  positionedItems,
  positionedRows,
  totalWidth,
  daysCount = 365
}) => {
  const { viewportElement, config, timelineStart } = useBoardContext();

  const rowVirtualizer = useVirtualizer({
    count: positionedRows.length,
    getScrollElement: () => viewportElement,
    estimateSize: (index) => positionedRows[index].height,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: daysCount,
    getScrollElement: () => viewportElement,
    estimateSize: () => config.dayColumnWidth,
    overscan: 2,
  });

  React.useEffect(() => {
    columnVirtualizer.measure?.();
  }, [config.dayColumnWidth, columnVirtualizer]);

  // "Hozir" chizig'i daqiqada bir marta suriladi.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), NOW_TICK_MS);
    return () => clearInterval(t);
  }, []);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const virtualColumns = columnVirtualizer.getVirtualItems();

  // Find the current vertical visibility range
  const rangeStartY = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const rangeEndY = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].end : 0;

  // Find the current horizontal visibility range
  const rangeStartX = virtualColumns.length > 0 ? virtualColumns[0].start : 0;
  const rangeEndX = virtualColumns.length > 0 ? virtualColumns[virtualColumns.length - 1].end : 0;

  // Only render items that intersect with both vertical and horizontal view
  const visibleItems = positionedItems.filter(item =>
    item.y + item.height >= rangeStartY && item.y <= rangeEndY &&
    item.x + item.width >= rangeStartX && item.x <= rangeEndX
  );

  const dayWidth = config.dayColumnWidth;
  const pixelsPerHour = dayWidth / 24;

  /*
    To'r chiziqlari DOM elementlari emas, background gradient bilan chiziladi:
    har kun uchun 4 ta <div> o'rniga bitta qatlam, va chiziqlar kartalar ostida
    qolib, ular bilan raqobatlashmaydi.
      1-qatlam (ustki) — kun chegarasi, `--border`
      2-qatlam         — 6 soatlik belgi, `--border-light`
  */
  const gridBackground: React.CSSProperties = {
    backgroundImage: [
      `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${dayWidth}px)`,
      `repeating-linear-gradient(to right, var(--border-light) 0 1px, transparent 1px ${dayWidth / 4}px)`,
    ].join(', '),
  };

  // Bugun ustuni va "hozir" chizig'ining kanvasdagi o'rni.
  const msSinceStart = now - timelineStart.getTime();
  const nowX = (msSinceStart / 3_600_000) * pixelsPerHour;
  const todayIndex = Math.floor(msSinceStart / 86_400_000);
  const isTodayVisible = todayIndex >= 0 && todayIndex < daysCount;

  return (
    <div
      className="relative"
      style={{ width: `${totalWidth}px`, height: `${totalHeight}px`, ...gridBackground }}
    >
      {/* Bugun ustuni — eng pastki qatlam, faqat sezilarli darajada tiniq */}
      {isTodayVisible && (
        <div
          className="absolute top-0 bottom-0 bg-primary/[0.04] pointer-events-none"
          style={{ left: `${todayIndex * dayWidth}px`, width: `${dayWidth}px` }}
        />
      )}

      {/* Qator ajratuvchilari — hairline, kartalar ostida */}
      {virtualRows.map((virtualRow) => {
        const row = positionedRows[virtualRow.index];
        return (
          <div
            key={row.id}
            className="absolute left-0 right-0 h-px bg-border-light pointer-events-none"
            style={{ top: `${virtualRow.start + virtualRow.size - 1}px` }}
          />
        );
      })}

      {/* Render Virtualized Timeline Items */}
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            top: `${item.y}px`,
            left: `${item.x}px`,
            width: `${item.width}px`,
            height: `${item.height}px`
          }}
        >
          {item.content}
        </div>
      ))}

      {/* "Hozir" chizig'i — kartalar ustida, lekin bosishni to'smaydi */}
      {isTodayVisible && (
        <div
          className="absolute top-0 bottom-0 w-px bg-primary/70 pointer-events-none z-20"
          style={{ left: `${nowX}px` }}
        >
          <div className="absolute -top-1 -left-[3px] w-[7px] h-[7px] rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
};
