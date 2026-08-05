import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBoardContext } from '../board/BoardContext';

interface TimelineHeaderProps {
  daysCount?: number;
}

/** `Date.getDay()` (0 = yakshanba) bo'yicha indekslanadi. */
const WEEKDAY_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const MONTH_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

/** Header'da faqat shu soatlar belgilanadi — har 6 soatda bitta tick. */
const HOUR_TICKS = [0, 6, 12, 18];

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({ daysCount = 365 }) => {
  const { config, timelineStart, viewportElement } = useBoardContext();

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: daysCount,
    getScrollElement: () => viewportElement,
    estimateSize: () => config.dayColumnWidth,
    overscan: 2,
  });

  React.useEffect(() => {
    // Force the virtualizer to recalculate sizes when zoom level changes
    columnVirtualizer.measure?.();
  }, [config.dayColumnWidth, columnVirtualizer]);

  const todayKey = React.useMemo(() => new Date().toDateString(), []);

  return (
    <div
      className="h-12 bg-surface border-b border-border relative z-20"
      style={{ width: `${columnVirtualizer.getTotalSize()}px` }}
    >
      {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
        const index = virtualColumn.index;
        const date = new Date(timelineStart);
        date.setDate(date.getDate() + index);
        const isToday = date.toDateString() === todayKey;

        return (
          <div
            key={index}
            className="absolute top-0 bottom-0 flex flex-col"
            style={{
              left: `${virtualColumn.start}px`,
              width: `${virtualColumn.size}px`
            }}
          >
            {/*
              Kun chegarasi — ustunning butun balandligini egallagan `border-r`
              o'rniga chap qirradagi bitta hairline. Kanvasdagi gradient aynan
              shu o'ringa tushadi, ya'ni header va tana bir tekislikda turadi.
            */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

            {/* Sana */}
            <div className="h-6 flex items-center pl-2.5">
              <span
                className={`text-[11px] tracking-tight truncate ${
                  isToday ? 'font-semibold text-primary' : 'font-medium text-text-secondary'
                }`}
              >
                {WEEKDAY_SHORT[date.getDay()]}, {date.getDate()} {MONTH_SHORT[date.getMonth()]}
              </span>
            </div>

            {/* Soat belgilari — to'liq balandlikdagi chiziq emas, 6px tick */}
            <div className="flex-1 relative">
              {HOUR_TICKS.map((hour) => (
                <div
                  key={hour}
                  className="absolute bottom-1 flex items-end gap-1"
                  style={{ left: `${(hour / 24) * 100}%` }}
                >
                  <div className="w-px h-1.5 bg-border" />
                  <span className="text-[10px] leading-none -mb-px text-text-muted tabular-nums">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
