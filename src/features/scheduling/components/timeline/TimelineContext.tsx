"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface TimelineContextType {
  startDate: Date;
  endDate: Date;
  days: Date[];
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};

interface TimelineProviderProps {
  children: ReactNode;
  initialDate?: Date;
  viewMode?: 'day' | 'week' | 'month';
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({
  children,
  initialDate = new Date(),
  viewMode = 'week',
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(1);

  // Calculate days based on viewMode
  const startDate = startOfWeek(initialDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(initialDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <TimelineContext.Provider
      value={{
        startDate,
        endDate,
        days,
        zoomLevel,
        setZoomLevel,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
};
