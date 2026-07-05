import React from 'react';
import { useBoardContext } from '../board/BoardContext';

interface TimelineHeaderProps {
  daysCount?: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({ daysCount = 30 }) => {
  const { config, timelineStart } = useBoardContext();
  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date(timelineStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex h-12 bg-surface border-b border-border relative z-20">
      {days.map((date, index) => (
        <div 
          key={index} 
          className="flex-shrink-0 border-r border-border flex flex-col"
          style={{ width: `${config.dayColumnWidth}px` }}
        >
          <div className="h-6 border-b border-border-light flex items-center justify-center bg-rail">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex-1 flex relative">
            {Array.from({ length: 4 }).map((_, segment) => (
              <div 
                key={segment} 
                className={`flex-1 flex items-end justify-center pb-0.5 text-[9px] font-medium text-text-muted
                ${segment < 3 ? 'border-r border-border-light' : ''}`}
              >
                <span 
                  className={`absolute ${index === 0 && segment === 0 ? 'translate-x-0 pl-2' : '-translate-x-1/2'}`} 
                  style={{ left: `${(segment * 25)}%` }}
                >
                  {String(segment * 6).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
