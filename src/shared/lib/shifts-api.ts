import { api } from "@/shared/lib/api";
import { differenceInCalendarDays, format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShiftStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ShiftStaffRole = "DOCTOR" | "NURSE";
export type PatientCondition = "STABLE" | "IMPROVING" | "WORSENING" | "CRITICAL";

export interface StaffRef {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface ShiftStaffMember {
  id: string;
  userId: string;
  role: ShiftStaffRole;
  user: StaffRef;
}

export interface Staffing {
  requiredDoctors: number;
  assignedDoctors: number;
  requiredNurses: number;
  assignedNurses: number;
}

export interface Shift {
  id: string;
  departmentId: string;
  startAt: string;
  endAt: string;
  requiredDoctors: number;
  requiredNurses: number;
  note: string | null;
  status: ShiftStatus;
  department: DepartmentRef;
  staff: ShiftStaffMember[];
  staffing: Staffing;
}

export interface BoardPatient {
  wardId: string;
  checkIn: string;
  daysStayed: number | null;
  status: string;
  patient: StaffRef;
}

export interface BoardRoom {
  id: string;
  name: string;
  floor: number | null;
  capacity: number;
  patients: BoardPatient[];
}

export interface WardRoundRef {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  notes: string | null;
  patientNotes: { patientId: string; condition: PatientCondition; notes: string | null; patient: StaffRef }[];
}

export interface CreateShiftPayload {
  departmentId: string;
  startAt: string;
  endAt: string;
  requiredDoctors: number;
  requiredNurses: number;
  note?: string;
  staff?: { userId: string; role: ShiftStaffRole }[];
}

export type UpdateShiftPayload = Partial<Omit<CreateShiftPayload, "staff">> & { status?: ShiftStatus };

// ─── API helpers ─────────────────────────────────────────────────────────────

export const shiftsApi = {
  list: (params?: { departmentId?: string; from?: string; to?: string; status?: ShiftStatus }) =>
    api.get<Shift[]>("/shifts", { params: params ?? {} }).then((r) => r.data),
  retrieve: (id: string) => api.get<Shift>(`/shifts/${id}`).then((r) => r.data),
  create: (data: CreateShiftPayload) => api.post<Shift>("/shifts", data).then((r) => r.data),
  update: (id: string, data: UpdateShiftPayload) => api.patch<Shift>(`/shifts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/shifts/${id}`).then((r) => r.data),
  assignStaff: (id: string, data: { userId: string; role: ShiftStaffRole }) =>
    api.post<Shift>(`/shifts/${id}/staff`, data).then((r) => r.data),
  unassignStaff: (id: string, userId: string) => api.delete<Shift>(`/shifts/${id}/staff/${userId}`).then((r) => r.data),
  board: (id: string) => api.get<BoardRoom[]>(`/shifts/${id}/board`).then((r) => r.data),

  // Xodim (duty) ekrani
  myActive: () => api.get<Shift[]>("/shifts/my/active").then((r) => r.data),
  myUpcoming: () => api.get<Shift[]>("/shifts/my").then((r) => r.data),

  // Obhod (ward-rounds)
  roundsByShift: (shiftId: string) => api.get<WardRoundRef[]>("/ward-rounds", { params: { shiftId } }).then((r) => r.data),
  createRound: (shiftId: string) => api.post<WardRoundRef>("/ward-rounds", { shiftId }).then((r) => r.data),

  // Bemor joylashtirish (wards) — mavjud endpointlar
  roomPatients: (roomId: string) => api.get<BoardPatient[]>(`/wards/room/${roomId}`).then((r) => r.data),
  checkIn: (data: { patientId: string; roomId: string; companionsCount?: number; note?: string }) =>
    api.post("/wards/check-in", data).then((r) => r.data),
  checkOut: (wardId: string, data?: { note?: string }) => api.patch(`/wards/${wardId}/check-out`, data ?? {}).then((r) => r.data),
};

// ─── Presentation helpers ─────────────────────────────────────────────────────

/** Smena bir kechada tugaydimi (ertasi kunga o'tadimi). */
export function isOvernight(startAt: string, endAt: string): boolean {
  return differenceInCalendarDays(new Date(endAt), new Date(startAt)) >= 1;
}

/** "20:00 → 08:00 (+1)" ko'rinishidagi qisqa vaqt oralig'i. */
export function fmtShiftRange(startAt: string, endAt: string): string {
  const start = format(new Date(startAt), "HH:mm");
  const end = format(new Date(endAt), "HH:mm");
  return isOvernight(startAt, endAt) ? `${start} → ${end} (+1)` : `${start} → ${end}`;
}

export function fmtShiftDay(startAt: string): string {
  return format(new Date(startAt), "dd.MM.yyyy");
}

export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  SCHEDULED: "Rejalashtirilgan",
  ACTIVE: "Faol",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

export const SHIFT_STATUS_STYLE: Record<ShiftStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-success-50 text-success border-success-100",
  COMPLETED: "bg-surface text-text-muted border-border",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export const CONDITION_LABEL: Record<PatientCondition, string> = {
  STABLE: "Barqaror",
  IMPROVING: "Yaxshilanmoqda",
  WORSENING: "Yomonlashmoqda",
  CRITICAL: "Kritik",
};

export const CONDITION_STYLE: Record<PatientCondition, string> = {
  STABLE: "bg-success-100 text-success border-success-100",
  IMPROVING: "bg-blue-100 text-blue-700 border-blue-200",
  WORSENING: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
};

/** Bo'lim rangini id'dan barqaror tanlaydi (kalendar rang-kodlash uchun). */
const DEPT_PALETTE = [
  "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#4f46e5",
];
export function departmentColor(departmentId: string): string {
  let hash = 0;
  for (let i = 0; i < departmentId.length; i++) hash = (hash * 31 + departmentId.charCodeAt(i)) & 0xffffffff;
  return DEPT_PALETTE[Math.abs(hash) % DEPT_PALETTE.length];
}

/** true — biror kvota to'liq emas (yetishmovchilik bor). */
export function isUnderstaffed(s: Staffing): boolean {
  return s.assignedDoctors < s.requiredDoctors || s.assignedNurses < s.requiredNurses;
}
