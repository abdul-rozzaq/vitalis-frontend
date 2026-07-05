import { create } from 'zustand';

interface SchedulingState {
  selectedDepartmentId: string | null;
  selectedScheduleId: string | null;
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  setDepartmentId: (id: string | null) => void;
  setScheduleId: (id: string | null) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
}

export const useSchedulingStore = create<SchedulingState>((set) => ({
  selectedDepartmentId: null,
  selectedScheduleId: null,
  selectedDate: new Date(),
  viewMode: 'week',
  setDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setScheduleId: (id) => set({ selectedScheduleId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
