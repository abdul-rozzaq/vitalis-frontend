export type AvailabilityType = 'AVAILABLE' | 'UNAVAILABLE';
export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SchedulePublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface StaffRole {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface WorkSchedule {
  id: string;
  departmentId: string;
  name: string;
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  status: SchedulePublishStatus;
  version: number;
}

export interface ShiftTemplate {
  id: string;
  departmentId?: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  requirements: ShiftTemplateRequirement[];
}

export interface ShiftTemplateRequirement {
  id: string;
  templateId: string;
  roleId: string;
  requiredCount: number;
  role?: StaffRole;
}

export interface ShiftRequirement {
  id: string;
  shiftId: string;
  roleId: string;
  requiredCount: number;
  role?: StaffRole;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  userId: string;
  roleId: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    photo?: string;
  };
  role?: StaffRole;
}

export interface Shift {
  id: string;
  departmentId: string;
  workScheduleId?: string;
  startAt: string; // ISO DateTime
  endAt: string; // ISO DateTime
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  requirements: ShiftRequirement[];
  assignments: ShiftAssignment[];
}

export interface StaffAvailability {
  id: string;
  userId: string;
  dayOfWeek: number; // 1-7
  startTime: string;
  endTime: string;
  type: AvailabilityType;
}

export interface StaffTimeOff {
  id: string;
  userId: string;
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  reason?: string;
  status: TimeOffStatus;
}
