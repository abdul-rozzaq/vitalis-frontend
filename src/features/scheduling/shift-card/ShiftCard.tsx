import React from 'react';

interface ShiftCardProps {
  id: string;
  name: string;
  timeRange: string;
  status: 'understaffed' | 'staffed' | 'overstaffed';
  width: number;
  // zoomLevel represents the overall board scale. 'compressed' means we are looking at a month at a glance.
  zoomLevel?: 'compressed' | 'normal' | 'expanded'; 
}

// A generic identity icon for shifts
const ShiftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c6.771.925 11.25 5.14 11.25 10.645 0 5.626-4.707 10.15-11.25 10.15C4.707 26.25 0 21.726 0 16.1c0-5.505 4.479-9.72 11.25-10.645v-.205zM12 9a.75.75 0 01.75.75v3.69l2.28 2.28a.75.75 0 11-1.06 1.06l-2.81-2.81A.75.75 0 0111.25 13.5v-3.75A.75.75 0 0112 9z" clipRule="evenodd" />
  </svg>
);

export const ShiftCard: React.FC<ShiftCardProps> = ({ name, timeRange, status, width, zoomLevel = 'normal' }) => {
  const borderColor = status === 'understaffed' ? 'border-red-400 dark:border-red-500' : 
                      status === 'staffed' ? 'border-green-400 dark:border-green-500' : 
                      'border-blue-400 dark:border-blue-500';
                      
  const bgColor = status === 'understaffed' ? 'bg-red-50 dark:bg-red-900/20' : 
                  status === 'staffed' ? 'bg-green-50 dark:bg-green-900/20' : 
                  'bg-blue-50 dark:bg-blue-900/20';

  const iconColor = status === 'understaffed' ? 'text-red-500' : 'text-green-500';

  // XS Level: Extreme compression (e.g. Month view) AND physical width is tiny.
  if (zoomLevel === 'compressed' || width < 40) {
    return (
      <div 
        className={`h-full w-full rounded-md border-2 ${borderColor} ${bgColor} cursor-pointer hover:brightness-95 transition-all`}
        title={`${name} (${timeRange})`}
      />
    );
  }

  // S Level: Icon only (preserves identity as a shift, not just a dot)
  if (width < 80) {
    return (
      <div className={`h-full w-full rounded-md border-2 ${borderColor} ${bgColor} p-1 flex items-center justify-center cursor-pointer hover:brightness-95 transition-all`} title={name}>
        <ShiftIcon className={iconColor} />
      </div>
    );
  }

  // M Level: Icon + Coverage Status
  if (width < 140) {
    return (
      <div className={`h-full w-full rounded-md border-2 ${borderColor} ${bgColor} p-2 flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all overflow-hidden`} title={name}>
        <ShiftIcon className={`${iconColor} mb-1`} />
        <div className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate w-full text-center">{status}</div>
      </div>
    );
  }

  // L Level: Name + Coverage
  if (width < 250) {
    return (
      <div className={`h-full w-full rounded-md border-2 ${borderColor} ${bgColor} px-1.5 py-1 flex flex-col justify-center cursor-pointer hover:brightness-95 transition-all overflow-hidden`}>
        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
          <ShiftIcon className={`w-3 h-3 ${iconColor}`} />
          {name}
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 capitalize">{status}</div>
      </div>
    );
  }

  // XL Level: Name + Time + Coverage + Avatars
  return (
    <div className={`h-full w-full rounded-md border-2 ${borderColor} ${bgColor} px-2 py-1 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all overflow-hidden`}>
      <div className="flex justify-between items-start">
        <div className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate pr-2 flex items-center gap-1.5">
          <ShiftIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          {name}
        </div>
        <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 rounded border border-gray-200 dark:border-gray-700 flex-shrink-0">
          {timeRange}
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700/50 pt-0.5">
        <div className="text-[10px] font-medium text-gray-600 dark:text-gray-300 capitalize flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'understaffed' ? 'bg-red-500' : 'bg-green-500'}`} />
          {status}
        </div>
        <div className="flex -space-x-1.5">
          {/* Mock nested staff avatars */}
          <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-white dark:border-gray-800" />
          <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-white dark:border-gray-800" />
        </div>
      </div>
    </div>
  );
};
