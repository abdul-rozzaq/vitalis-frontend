import { api } from "@/lib/api";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface StaffRef {
  id: string;
  first_name: string;
  last_name: string;
}

export interface RoomRef {
  id: string;
  name: string;
}

export interface RoomShift {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  startMinute: number;
  endMinute: number;
  color: string | null;
  roundHour: number | null;
  defaultNurses: { id: string; nurseId: string; nurse: StaffRef }[];
  rooms: { id: string; roomId: string; room: RoomRef }[];
}

export type ShiftOverrideType = "FULL_OVERRIDE" | "SWAP" | "PARTIAL_TRANSFER" | "OVERTIME";

export interface ResolvedSlot {
  date: string;
  shift: { id: string; name: string; startHour: number; endHour: number };
  room: RoomRef;
  assignment: {
    id: string;
    doctorId: string;
    isOverride: boolean;
    overrideType: ShiftOverrideType | null;
    doctor: StaffRef;
    nurses: { nurseId: string; nurse: StaffRef }[];
  } | null;
  doctor: StaffRef | null;
  nurses: { nurseId: string; nurse: StaffRef }[];
  source: "assigned" | "none";
}

export type ShiftEventType =
  | "SWAP_REQUEST"
  | "SWAP_APPROVED"
  | "SWAP_REJECTED"
  | "FULL_TRANSFER"
  | "PARTIAL_TRANSFER"
  | "OVERTIME_ADDED"
  | "OVERRIDE_CREATED"
  | "OVERRIDE_DELETED";

export interface ShiftChangeEvent {
  id: string;
  eventType: ShiftEventType;
  date: string;
  windowStart: number | null;
  windowEnd: number | null;
  reason: string | null;
  createdAt: string;
  fromDoctor: StaffRef;
  toDoctor: StaffRef | null;
  requestedBy: StaffRef;
  roomShift?: { id: string; name: string; startHour: number; endHour: number };
}

export type ShiftNotifType =
  | "SWAP_REQUESTED"
  | "SWAP_APPROVED"
  | "SWAP_REJECTED"
  | "SHIFT_CHANGED"
  | "SHIFT_REMINDER";

export interface ShiftNotification {
  id: string;
  type: ShiftNotifType;
  payload: Record<string, unknown> & { message?: string; shiftName?: string; date?: string };
  readAt: string | null;
  createdAt: string;
}

export interface WorkingHoursLog {
  id: string;
  date: string;
  plannedStart: number;
  plannedEnd: number;
  plannedHours: number;
  actualHours: number;
  overtimeHours: number;
  user: StaffRef;
  shiftAssignment?: { roomShift: { id: string; name: string } } | null;
}

export interface WorkingHoursSummary {
  userId: string;
  period: "week" | "month";
  from: string;
  to: string;
  totalPlanned: number;
  totalActual: number;
  totalOvertime: number;
  days: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export const shiftsApi = {
  // Templates
  listTemplates: (roomId?: string) =>
    api.get<RoomShift[]>("/room-shifts", { params: roomId ? { roomId } : {} }).then((r) => r.data),
  createTemplate: (data: Record<string, unknown>) => api.post("/room-shifts", data).then((r) => r.data),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    api.patch(`/room-shifts/${id}`, data).then((r) => r.data),
  deleteTemplate: (id: string) => api.delete(`/room-shifts/${id}`).then((r) => r.data),
  addRoomToTemplate: (id: string, roomId: string) => api.post(`/room-shifts/${id}/rooms`, { roomId }).then((r) => r.data),
  removeRoomFromTemplate: (id: string, roomId: string) => api.delete(`/room-shifts/${id}/rooms/${roomId}`).then((r) => r.data),

  // Resolved calendar range
  resolvedRange: (params: { from: string; to: string; roomId?: string }) =>
    api.get<ResolvedSlot[]>("/shift-assignments", { params }).then((r) => r.data),

  // Bulk assign (shifokorni bir nechta kunga tayinlash)
  bulkAssign: (data: { roomShiftId: string; roomId: string; doctorId: string; dates: string[] }) =>
    api.post("/shift-assignments/bulk", data).then((r) => r.data),

  // Overrides & operations
  createOverride: (data: { roomShiftId: string; roomId: string; date: string; doctorId: string; nurseIds?: string[] }) =>
    api.post("/shift-assignments/override", data).then((r) => r.data),
  deleteOverride: (id: string) => api.delete(`/shift-assignments/override/${id}`).then((r) => r.data),
  swap: (data: { fromAssignmentId: string; toAssignmentId: string; reason?: string }) =>
    api.post("/shift-assignments/swap", data).then((r) => r.data),
  partialTransfer: (data: { assignmentId: string; toDoctorId: string; windowStart: number; windowEnd: number; reason?: string }) =>
    api.post("/shift-assignments/partial-transfer", data).then((r) => r.data),
  overtime: (data: { assignmentId: string; newEndHour: number; reason?: string }) =>
    api.post("/shift-assignments/overtime", data).then((r) => r.data),
  assignmentHistory: (id: string) =>
    api.get<ShiftChangeEvent[]>(`/shift-assignments/${id}/history`).then((r) => r.data),

  // Events (admin history)
  events: (params: { userId?: string; from?: string; to?: string; type?: ShiftEventType }) =>
    api.get<ShiftChangeEvent[]>("/shift-events", { params }).then((r) => r.data),

  // Notifications
  myNotifications: () => api.get<ShiftNotification[]>("/shift-notifications/my").then((r) => r.data),
  unreadCount: () => api.get<number>("/shift-notifications/my/unread-count").then((r) => r.data),
  markRead: (id: string) => api.patch(`/shift-notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch("/shift-notifications/read-all").then((r) => r.data),

  // Working hours
  workHours: (params: { userId?: string; from?: string; to?: string }) =>
    api.get<WorkingHoursLog[]>("/working-hours", { params }).then((r) => r.data),
  workHoursSummary: (userId: string, period: "week" | "month") =>
    api.get<WorkingHoursSummary>("/working-hours/summary", { params: { userId, period } }).then((r) => r.data),
  myWorkHours: () => api.get<WorkingHoursLog[]>("/working-hours/my").then((r) => r.data),

  // Workspace (doctor / nurse)
  myActiveShifts: () => api.get<ActiveShift[]>("/shift-assignments/my/active").then((r) => r.data),
  myUpcomingShifts: () => api.get<MyShifts>("/shift-assignments/my").then((r) => r.data),
  roomPatients: (roomId: string) => api.get<WardPatient[]>(`/wards/room/${roomId}`).then((r) => r.data),
  roundsByAssignment: (assignmentId: string) =>
    api.get<WardRoundRef[]>(`/ward-rounds?shiftAssignmentId=${assignmentId}`).then((r) => r.data),
};

export interface ActiveShift {
  roomShiftId: string;
  roomShift: { id: string; name: string; startHour: number; endHour: number };
  roomId: string;
  room: { id: string; name: string };
  doctorId: string;
  doctor: StaffRef;
  nurses: { nurseId: string; nurse: StaffRef }[];
  date: string | null;
  isOverride: boolean;
  assignmentId: string | null;
}

export interface MyShifts {
  overrides: { id: string; date: string; roomShift: { name: string }; room: RoomRef; doctor: StaffRef }[];
}

export interface WardPatient {
  id: string;
  checkIn: string;
  daysStayed: number | null;
  status: string;
  patient: StaffRef;
}

export interface WardRoundRef {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  patientNotes: { patientId: string; condition: string; notes: string | null; patient: StaffRef }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmtHM(hour: number, minute = 0): string {
  const h = hour === 24 ? 0 : hour;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const SHIFT_EVENT_LABEL: Record<ShiftEventType, string> = {
  SWAP_REQUEST: "Almashish so'rovi",
  SWAP_APPROVED: "Almashish tasdiqlandi",
  SWAP_REJECTED: "Almashish rad etildi",
  FULL_TRANSFER: "To'liq o'tkazish",
  PARTIAL_TRANSFER: "Qisman o'tkazish",
  OVERTIME_ADDED: "Qo'shimcha ish vaqti",
  OVERRIDE_CREATED: "Override yaratildi",
  OVERRIDE_DELETED: "Override o'chirildi",
};

export const SHIFT_EVENT_COLOR: Record<ShiftEventType, string> = {
  SWAP_REQUEST: "bg-amber-50 text-amber-700 border-amber-200",
  SWAP_APPROVED: "bg-green-50 text-green-700 border-green-200",
  SWAP_REJECTED: "bg-red-50 text-red-700 border-red-200",
  FULL_TRANSFER: "bg-blue-50 text-blue-700 border-blue-200",
  PARTIAL_TRANSFER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OVERTIME_ADDED: "bg-purple-50 text-purple-700 border-purple-200",
  OVERRIDE_CREATED: "bg-slate-50 text-slate-700 border-slate-200",
  OVERRIDE_DELETED: "bg-red-50 text-red-700 border-red-200",
};
