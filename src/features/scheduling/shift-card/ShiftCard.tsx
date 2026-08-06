import {
  attendanceTone,
  fmtMinutes,
  ShiftAttendance,
  Staffing,
} from '@/shared/lib/shifts-api';
import React from 'react';
import { useBoardContext } from '../board/BoardContext';

interface ShiftCardProps {
  id: string;
  name: string;
  timeRange: string;
  staffing: Staffing;
  attendance: ShiftAttendance;
  width: number;
  zoomLevel?: 'compressed' | 'normal' | 'expanded';
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  id,
  name,
  timeRange,
  staffing,
  attendance,
  width,
  zoomLevel = 'normal',
}) => {
  const { selectedItemIds, setSelectedItemIds, hoveredItemId, setHoveredItemId } = useBoardContext();

  const isSelected = selectedItemIds.includes(id);
  const isHovered = hoveredItemId === id;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Basic single-select for now (multi-select will use shift/ctrl key modifiers)
    if (e.shiftKey || e.metaKey) {
      setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedItemIds([id]);
    }
  };

  const handleMouseEnter = () => setHoveredItemId(id);
  const handleMouseLeave = () => setHoveredItemId(null);

  const assigned = staffing.assignedDoctors + staffing.assignedNurses;
  const required = staffing.requiredDoctors + staffing.requiredNurses;
  const isUnderstaffed = assigned < required;

  /*
    Karta ikki qatlamni ko'rsatadi:
      REJA     — `assigned/required`, kim biriktirilgan
      HAQIQAT  — `attendance`, kim skanerlab kirgan

    Davomat ma'lumoti bo'lgan smenada rang HAQIQATga qarab tanlanadi;
    kelajakdagi smenalarda esa rejaga qaytadi.
  */
  const tone = attendanceTone(attendance);
  const hasAttendance = attendance.expected > 0 && (attendance.arrived > 0 || attendance.isRunning || attendance.absent > 0 || attendance.incomplete > 0);

  const statusColor = hasAttendance
    ? tone === 'alarm'
      ? 'bg-danger'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-success'
    : isUnderstaffed
      ? 'bg-warning'
      : 'bg-success';

  /** Ikkinchi qator matni — davomat bo'lsa haqiqat, aks holda reja. */
  const factLine = hasAttendance
    ? attendance.isRunning && attendance.arrived === 0
      ? 'Hech kim kelmagan'
      : [
          `${attendance.arrived}/${attendance.expected} keldi`,
          attendance.late > 0 ? `${attendance.late} kech` : '',
          attendance.absent > 0 ? `${attendance.absent} kelmadi` : '',
          attendance.incomplete > 0 ? `${attendance.incomplete} to'liqsiz` : '',
        ]
          .filter(Boolean)
          .join(' · ')
    : `${assigned}/${required} xodim`;

  const stateStyle = isSelected
    ? 'ring-2 ring-primary shadow-md z-10'
    : isHovered
      ? 'shadow-md z-10'
      : 'shadow-xs';

  const cardClasses = `h-full w-full rounded-md bg-surface cursor-pointer transition-shadow overflow-hidden relative ${stateStyle}`;

  const tooltip = `${name} · ${timeRange} · reja ${assigned}/${required}${
    hasAttendance ? ` · ${factLine}` : ''
  }`;

  const accent = <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusColor}`} />;

  /* Faol smenada nuqta "tirik" bo'ladi — jonli ekanini bildiradi. */
  const dot = (size: string) => (
    <span className={`relative flex shrink-0 ${size}`}>
      {attendance.isRunning && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${statusColor}`} />
      )}
      <span className={`relative inline-flex rounded-full h-full w-full ${statusColor}`} />
    </span>
  );

  const handlers = {
    onPointerDown: handlePointerDown,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  // XS: faqat aksent chizig'i
  if (zoomLevel === 'compressed' || width < 40) {
    return (
      <div {...handlers} className={cardClasses} title={tooltip}>
        {accent}
      </div>
    );
  }

  // S: holat nuqtasi
  if (width < 80) {
    return (
      <div {...handlers} className={`${cardClasses} flex items-center justify-center`} title={tooltip}>
        {accent}
        {dot('w-2 h-2')}
      </div>
    );
  }

  // M: to'lganlik nisbati
  if (width < 140) {
    return (
      <div
        {...handlers}
        className={`${cardClasses} flex items-center justify-center gap-1.5 pl-3 pr-2`}
        title={tooltip}
      >
        {accent}
        {dot('w-1.5 h-1.5')}
        <span className="text-[11px] font-medium text-text-secondary tabular-nums">
          {hasAttendance ? `${attendance.arrived}/${attendance.expected}` : `${assigned}/${required}`}
        </span>
      </div>
    );
  }

  // L: nom + nisbat
  if (width < 250) {
    return (
      <div
        {...handlers}
        className={`${cardClasses} flex flex-col justify-center gap-0.5 pl-3 pr-2`}
        title={tooltip}
      >
        {accent}
        <div className="flex items-center gap-1.5 min-w-0">
          {dot('w-1.5 h-1.5')}
          <span className="text-xs font-semibold text-text truncate">{name}</span>
        </div>
        <span className={`text-[11px] tabular-nums pl-3 truncate ${hasAttendance && tone !== 'ok' ? 'text-warning' : 'text-text-muted'}`}>
          {factLine}
        </span>
      </div>
    );
  }

  // XL: to'liq tafsilot
  return (
    <div {...handlers} className={`${cardClasses} flex flex-col justify-center gap-1 pl-3 pr-2.5`}>
      {accent}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {dot('w-1.5 h-1.5')}
          <span className="text-xs font-semibold text-text truncate">{name}</span>
        </div>
        <span className="text-[11px] font-mono text-text-muted shrink-0 tabular-nums">
          {timeRange}
        </span>
      </div>

      {/* REJA */}
      <div className="flex items-center gap-3 pl-3 text-[11px] tabular-nums">
        <span
          className={
            staffing.assignedDoctors < staffing.requiredDoctors
              ? 'text-warning font-medium'
              : 'text-text-muted'
          }
        >
          Shifokor {staffing.assignedDoctors}/{staffing.requiredDoctors}
        </span>
        <span
          className={
            staffing.assignedNurses < staffing.requiredNurses
              ? 'text-warning font-medium'
              : 'text-text-muted'
          }
        >
          Hamshira {staffing.assignedNurses}/{staffing.requiredNurses}
        </span>
      </div>

      {/* HAQIQAT — faqat davomat ma'lumoti bo'lganda */}
      {hasAttendance && (
        <div className="flex items-center gap-2 pl-3 text-[11px] tabular-nums min-w-0">
          <span
            className={
              tone === 'alarm'
                ? 'text-danger font-medium'
                : tone === 'warning'
                  ? 'text-warning font-medium'
                  : 'text-success font-medium'
            }
          >
            {factLine}
          </span>
          {attendance.totalLateMinutes > 0 && (
            <span className="text-text-muted truncate">
              +{fmtMinutes(attendance.totalLateMinutes)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
