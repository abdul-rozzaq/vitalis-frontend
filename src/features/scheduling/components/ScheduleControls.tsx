"use client";

import React, { useEffect } from 'react';
import { useSchedulingStore } from '../store';
import { useWorkSchedule, useWorkSchedules } from '../api';

export const ScheduleControls: React.FC = () => {
  const { selectedScheduleId, setScheduleId } = useSchedulingStore();
  
  // Fetch all schedules to get the default one if none selected
  const { data: schedules } = useWorkSchedules();

  useEffect(() => {
    if (!selectedScheduleId && schedules && schedules.length > 0) {
      setScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId, setScheduleId]);

  const { data: schedule, isLoading } = useWorkSchedule(selectedScheduleId);

  if (isLoading && selectedScheduleId) {
    return <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>;
  }

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl mb-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {schedule?.name || 'Untitled Schedule'}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            schedule?.status === 'PUBLISHED' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {schedule?.status || 'DRAFT'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Version {schedule?.version || 1}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Apply Template
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          Publish Schedule
        </button>
      </div>
    </div>
  );
};
