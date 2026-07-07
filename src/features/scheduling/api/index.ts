import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shift, WorkSchedule, ShiftAssignment } from '../types';
import { api } from '@/shared/lib/api';

const SCHEDULE_API = {
  getWorkSchedules: async (): Promise<WorkSchedule[]> => {
    const { data } = await api.get(`/scheduling/schedules`);
    return data;
  },
  getWorkSchedule: async (id: string): Promise<WorkSchedule> => {
    const { data } = await api.get(`/scheduling/schedules/${id}`);
    return data;
  },
  getDepartments: async () => {
    const { data } = await api.get(`/departments`);
    return data;
  },
  getBoardShifts: async (from: string, to: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await api.get(`/shifts?${params.toString()}`);
    return data;
  },
  getShifts: async (scheduleId: string): Promise<Shift[]> => {
    const { data } = await api.get(`/scheduling/schedules/${scheduleId}`);
    return data.shifts || [];
  },
  createShift: async (shift: any): Promise<any> => {
    const { data } = await api.post('/shifts', shift);
    return data;
  },
  updateShift: async (shiftId: string, payload: any): Promise<any> => {
    const { data } = await api.patch(`/shifts/${shiftId}`, payload);
    return data;
  },
  deleteShift: async (shiftId: string): Promise<void> => {
    await api.delete(`/shifts/${shiftId}`);
  },
  updateAssignment: async (shiftId: string, payload: Partial<ShiftAssignment>): Promise<ShiftAssignment> => {
    const { data } = await api.post(`/shifts/${shiftId}/staff`, payload);
    return data;
  }
};

export const useWorkSchedules = () => {
  return useQuery({
    queryKey: ['workSchedules'],
    queryFn: () => SCHEDULE_API.getWorkSchedules(),
  });
};

export const useWorkSchedule = (id: string | null) => {
  return useQuery({
    queryKey: ['workSchedule', id],
    queryFn: () => SCHEDULE_API.getWorkSchedule(id!),
    enabled: !!id,
  });
};

export const useShifts = (scheduleId: string | null) => {
  return useQuery({
    queryKey: ['shifts', scheduleId],
    queryFn: () => SCHEDULE_API.getShifts(scheduleId!),
    enabled: !!scheduleId,
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => SCHEDULE_API.getDepartments(),
  });
};

export const useBoardShifts = (from: string, to: string) => {
  return useQuery({
    queryKey: ['board-shifts', from, to],
    queryFn: () => SCHEDULE_API.getBoardShifts(from, to),
  });
};

export const useStaffMembers = () => {
  return useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      // Filter for medical staff (doctors and nurses) and map to expected structure
      const medicalStaff = data.filter((user: any) => 
        ['DOCTOR', 'HAMSHIRA', 'FELDSHER'].includes(user.role)
      );

      return medicalStaff.map((user: any) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: { 
          id: user.role, // Use enum as id for now since they map 1:1
          name: user.role === 'DOCTOR' ? 'Shifokor' : user.role === 'HAMSHIRA' ? 'Hamshira' : 'Feldsher', 
          code: user.role 
        },
      }));
    }
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShiftAssignment> }) => 
      SCHEDULE_API.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      SCHEDULE_API.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-shifts'] });
    },
  });
};

export const useCreateBoardShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => SCHEDULE_API.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-shifts'] });
    },
  });
};

export const useDeleteBoardShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SCHEDULE_API.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-shifts'] });
    },
  });
};
