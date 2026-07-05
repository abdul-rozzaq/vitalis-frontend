import React from 'react';
import { useBoardContext } from '../board/BoardContext';

interface ShiftCardProps {
  id: string;
  name: string;
  timeRange: string;
  status: 'understaffed' | 'staffed' | 'overstaffed';
  width: number;
  zoomLevel?: 'compressed' | 'normal' | 'expanded'; 
}

// A generic identity icon for shifts
const ShiftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c6.771.925 11.25 5.14 11.25 10.645 0 5.626-4.707 10.15-11.25 10.15C4.707 26.25 0 21.726 0 16.1c0-5.505 4.479-9.72 11.25-10.645v-.205zM12 9a.75.75 0 01.75.75v3.69l2.28 2.28a.75.75 0 11-1.06 1.06l-2.81-2.81A.75.75 0 0111.25 13.5v-3.75A.75.75 0 0112 9z" clipRule="evenodd" />
  </svg>
);

export const ShiftCard: React.FC<ShiftCardProps> = ({ id, name, timeRange, status, width, zoomLevel = 'normal' }) => {
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

  const baseBorderColor = status === 'understaffed' ? 'border-danger' : 
                          status === 'staffed' ? 'border-success' : 
                          'border-info';
                      
  const baseBgColor = status === 'understaffed' ? 'bg-danger-50' : 
                      status === 'staffed' ? 'bg-success-50' : 
                      'bg-info-50';

  const iconColor = status === 'understaffed' ? 'text-danger' : 'text-success';

  // State-driven UI modifiers
  const selectedStyle = isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-md scale-[1.02] z-10' : '';
  const hoverStyle = isHovered && !isSelected ? 'brightness-95 shadow-sm scale-[1.01] z-10' : '';
  
  const cardClasses = `h-full w-full rounded-md border-2 ${baseBorderColor} ${baseBgColor} cursor-pointer transition-all overflow-hidden ${selectedStyle} ${hoverStyle}`;

  // XS Level: Extreme compression
  if (zoomLevel === 'compressed' || width < 40) {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cardClasses}
        title={`${name} (${timeRange})`}
      />
    );
  }

  // S Level: Icon only
  if (width < 80) {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${cardClasses} p-1 flex items-center justify-center`} 
        title={name}
      >
        <ShiftIcon className={iconColor} />
      </div>
    );
  }

  // M Level: Icon + Coverage Status
  if (width < 140) {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${cardClasses} p-2 flex flex-col items-center justify-center`} 
        title={name}
      >
        <ShiftIcon className={`${iconColor} mb-1`} />
        <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider truncate w-full text-center">{status}</div>
      </div>
    );
  }

  // L Level: Name + Coverage
  if (width < 250) {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${cardClasses} px-1.5 py-1 flex flex-col justify-center`}
      >
        <div className="text-xs font-bold text-text truncate flex items-center gap-1.5">
          <ShiftIcon className={`w-3 h-3 ${iconColor}`} />
          {name}
        </div>
        <div className="text-[10px] text-text-muted truncate mt-0.5 capitalize">{status}</div>
      </div>
    );
  }

  // XL Level: Full Explicit Details
  return (
    <div 
      onPointerDown={handlePointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${cardClasses} px-2 py-1 flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <div className="font-bold text-xs text-text truncate pr-2 flex items-center gap-1.5">
          <ShiftIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          {name}
        </div>
        <div className="text-[10px] font-mono text-text-muted bg-surface px-1 rounded border border-border-light flex-shrink-0">
          {timeRange}
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-border-light pt-0.5 mt-1">
        <div className="text-[10px] font-medium text-text-secondary capitalize flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'understaffed' ? 'bg-danger' : 'bg-success'}`} />
          {status}
        </div>
        <div className="flex -space-x-1.5">
          {/* Mock nested staff avatars */}
          <div className="w-4 h-4 rounded-full bg-info-50 border-2 border-surface" />
          <div className="w-4 h-4 rounded-full bg-success-50 border-2 border-surface" />
        </div>
      </div>
    </div>
  );
};


