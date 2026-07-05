import React from 'react';

export const TimelineHeader: React.FC = () => {
  // Mock generated days and hours for architecture
  const days = Array.from({ length: 7 }).map((_, i) => `Day ${i + 1}`);
  
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-10">
      {days.map((day, idx) => (
        <div key={idx} className="w-[600px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 relative">
          <div className="absolute top-1 left-2 text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{day}</div>
          
          {/* Vertical Grid Lines within the header */}
          <div className="absolute top-0 bottom-0 left-[200px] border-l border-gray-100 dark:border-gray-800/50" />
          <div className="absolute top-0 bottom-0 left-[400px] border-l border-gray-100 dark:border-gray-800/50" />

          {/* Time Labels exactly centered on the grid lines */}
          {idx === 0 && (
            <div className="absolute bottom-0.5 left-0 -translate-x-1/2 text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1 z-10 font-mono">00:00</div>
          )}
          <div className="absolute bottom-0.5 left-[200px] -translate-x-1/2 text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1 font-mono">08:00</div>
          <div className="absolute bottom-0.5 left-[400px] -translate-x-1/2 text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1 font-mono">16:00</div>
          <div className="absolute bottom-0.5 right-0 translate-x-1/2 text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1 z-10 font-mono">00:00</div>
        </div>
      ))}
    </div>
  );
};
