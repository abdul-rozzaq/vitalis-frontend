import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBoardContext } from '../board/BoardContext';
import { TimelineRow } from '../timeline/types';

interface SidebarProps {
  rows: TimelineRow[];
}

/**
 * Bo'lim nuqtasi rangi — id dan deterministik tanlanadi, shuning uchun
 * bo'lim har safar bir xil rang bilan ko'rinadi.
 */
const ROW_DOT_COLORS = [
  'bg-info',
  'bg-success',
  'bg-warning',
  'bg-primary',
  'bg-danger',
];

const dotColorFor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ROW_DOT_COLORS[Math.abs(hash) % ROW_DOT_COLORS.length];
};

export const Sidebar: React.FC<SidebarProps> = ({ rows }) => {
  const { viewportElement } = useBoardContext();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportElement,
    estimateSize: (index) => rows[index].height,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="h-12 px-4 border-b border-border text-text-secondary flex items-center text-xs font-semibold z-10 bg-surface">
        Bo&apos;limlar
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="px-4 hover:bg-surface-hover cursor-pointer transition-colors flex items-center gap-2.5 bg-surface"
                title={row.title}
              >
                {/* Qator ajratuvchisi — kanvasdagi hairline bilan bir xil */}
                <div className="absolute left-0 right-0 bottom-0 h-px bg-border-light" />
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorFor(row.id)}`} />
                <span className="text-[13px] font-medium text-text truncate">{row.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
