import { api } from "@/shared/lib/api";
import { ROLE_STYLES } from "@/shared/lib/status-styles";
import type { UserRole } from "@/shared/types/user";
import { differenceInCalendarDays, format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShiftStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
/** Smenaga biriktirilgan xodimning roli — har doim `user.role` bilan bir xil. */
export type ShiftStaffRole = UserRole;
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

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "EARLY_LEAVE"
  | "LATE_AND_EARLY_LEAVE"
  | "ABSENT"
  | "MISSING_CHECKOUT"
  | "MISSING_CHECKIN";

/** Bitta xodimning bitta smenadagi haqiqiy davomati. */
export interface ShiftAttendanceRecord {
  userId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  /** Smena oynasi ichida haqiqatda ichkarida bo'lgan daqiqalar. */
  workedMinutes: number;
  absentMinutes: number;
  status: AttendanceStatus;
  /** Kirish skanidagi yuz rasmi (Hikvision terminalidan). */
  checkInPicture: string | null;
}

/** Smena bo'yicha davomat xulosasi — reja emas, haqiqat. */
export interface ShiftAttendance {
  expected: number;
  arrived: number;
  late: number;
  absent: number;
  /** Kirish yoki chiqish skani yo'q — operator aralashuvi kerak. */
  incomplete: number;
  /** Hozir ichkarida (faqat davom etayotgan smenada ma'noli). */
  insideNow: number;
  totalLateMinutes: number;
  totalWorkedMinutes: number;
  /** Smena ayni damda davom etyaptimi. */
  isRunning: boolean;
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
  attendance: ShiftAttendance;
  attendanceRecords: ShiftAttendanceRecord[];
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

/** `GET /shifts` sahifalangan javob qaytaradi. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ShiftsQuery {
  departmentId?: string;
  from?: string;
  to?: string;
  status?: ShiftStatus;
  page?: number;
  limit?: number;
}

// ─── Shablonlar ──────────────────────────────────────────────────────────────

export interface ShiftTemplate {
  id: string;
  departmentId: string;
  name: string;
  /** "HH:mm" — klinika vaqti */
  startTime: string;
  endTime: string;
  requiredDoctors: number;
  requiredNurses: number;
  /** [1=Dushanba .. 7=Yakshanba]. Bo'sh = har kuni. */
  daysOfWeek: number[];
  isActive: boolean;
  department: DepartmentRef;
  /** Backend hisoblaydi: smena yarim tundan o'tadimi. */
  crossesMidnight: boolean;
}

export interface CreateTemplatePayload {
  departmentId: string;
  name: string;
  startTime: string;
  endTime: string;
  requiredDoctors?: number;
  requiredNurses?: number;
  daysOfWeek?: number[];
}

export type UpdateTemplatePayload = Partial<Omit<CreateTemplatePayload, "departmentId">> & { isActive?: boolean };

// ─── Generatsiya / ommaviy biriktirish ───────────────────────────────────────

export interface GeneratePayload {
  departmentId: string;
  templateIds: string[];
  /** "YYYY-MM-DD" */
  from: string;
  to: string;
  daysOfWeek?: number[];
  dryRun?: boolean;
}

export interface PlannedShift {
  templateId: string;
  templateName: string;
  startAt: string;
  endAt: string;
  requiredDoctors: number;
  requiredNurses: number;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  toCreate: PlannedShift[];
  skippedShifts: PlannedShift[];
  dryRun: boolean;
}

export interface BulkAssignPayload {
  shiftIds: string[];
  staff: { userId: string; role: ShiftStaffRole }[];
  dryRun?: boolean;
}

export interface BulkAssignResult {
  assigned: number;
  skipped: { shiftId: string; userId: string; reason: string }[];
  toCreate: { shiftId: string; userId: string; role: ShiftStaffRole }[];
  dryRun: boolean;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export const shiftsApi = {
  /** Sahifalangan javob. Faqat massiv kerak bo'lsa `listAll` ishlating. */
  list: (params?: ShiftsQuery) =>
    api.get<Paginated<Shift>>("/shifts", { params: params ?? {} }).then((r) => r.data),
  /** Qulaylik uchun: sahifalash qobig'ini ochib, faqat smenalarni qaytaradi. */
  listAll: (params?: ShiftsQuery) =>
    api.get<Paginated<Shift>>("/shifts", { params: params ?? {} }).then((r) => r.data.data),
  retrieve: (id: string) => api.get<Shift>(`/shifts/${id}`).then((r) => r.data),
  create: (data: CreateShiftPayload) => api.post<Shift>("/shifts", data).then((r) => r.data),
  update: (id: string, data: UpdateShiftPayload) => api.patch<Shift>(`/shifts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/shifts/${id}`).then((r) => r.data),
  assignStaff: (id: string, data: { userId: string; role: ShiftStaffRole }) =>
    api.post<Shift>(`/shifts/${id}/staff`, data).then((r) => r.data),
  unassignStaff: (id: string, userId: string) => api.delete<Shift>(`/shifts/${id}/staff/${userId}`).then((r) => r.data),
  board: (id: string) => api.get<BoardRoom[]>(`/shifts/${id}/board`).then((r) => r.data),

  // Shablonlar
  templates: (params?: { departmentId?: string; includeInactive?: boolean }) =>
    api.get<ShiftTemplate[]>("/shift-templates", { params: params ?? {} }).then((r) => r.data),
  createTemplate: (data: CreateTemplatePayload) =>
    api.post<ShiftTemplate>("/shift-templates", data).then((r) => r.data),
  updateTemplate: (id: string, data: UpdateTemplatePayload) =>
    api.patch<ShiftTemplate>(`/shift-templates/${id}`, data).then((r) => r.data),
  removeTemplate: (id: string) => api.delete(`/shift-templates/${id}`).then((r) => r.data),

  // Ommaviy amallar
  generate: (data: GeneratePayload) => api.post<GenerateResult>("/shifts/generate", data).then((r) => r.data),
  bulkAssign: (data: BulkAssignPayload) =>
    api.post<BulkAssignResult>("/shifts/bulk-assign", data).then((r) => r.data),

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

// ─── Davomat helperlari ──────────────────────────────────────────────────────

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Keldi",
  LATE: "Kech keldi",
  EARLY_LEAVE: "Erta ketdi",
  LATE_AND_EARLY_LEAVE: "Kech keldi, erta ketdi",
  ABSENT: "Kelmadi",
  MISSING_CHECKOUT: "Chiqish skani yo'q",
  MISSING_CHECKIN: "Kirish skani yo'q",
};

/**
 * Smenaning davomat holati — kartadagi rang shu bo'yicha tanlanadi.
 *
 * `alarm` — smena davom etyapti, lekin biriktirilgan xodimlardan hech kim
 * kelmagan. Klinika uchun eng kritik holat.
 */
export type AttendanceTone = "alarm" | "warning" | "ok" | "idle";

export function attendanceTone(a: ShiftAttendance): AttendanceTone {
  if (a.expected === 0) return "idle";
  if (a.isRunning && a.arrived === 0) return "alarm";
  if (a.absent > 0) return "alarm";
  if (a.late > 0 || a.incomplete > 0 || a.arrived < a.expected) return "warning";
  if (a.arrived > 0) return "ok";
  return "idle";
}

/** `134` → `2s 14daq`. Nol bo'lsa bo'sh satr. */
export function fmtMinutes(min: number): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}daq`;
  return m ? `${h}s ${m}daq` : `${h}s`;
}

export function fmtClock(iso: string | null): string {
  return iso ? format(new Date(iso), "HH:mm") : "";
}

/** Smena roli uchun ko'rsatiladigan nom — `user.role` bilan bir xil qiymatlar. */
export const SHIFT_ROLE_LABEL: Record<ShiftStaffRole, string> = Object.fromEntries(
  Object.entries(ROLE_STYLES).map(([role, style]) => [role, style.label]),
) as Record<ShiftStaffRole, string>;

/** 1=Dushanba .. 7=Yakshanba */
export const WEEKDAY_LABELS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"] as const;

/** `daysOfWeek` ni o'qiladigan matnga aylantiradi. */
export function fmtDaysOfWeek(days: number[]): string {
  if (!days.length) return "Har kuni";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d - 1])
    .join(", ");
}

/** Shablon vaqt oralig'i: "22:00 → 06:00 (+1)" */
export function fmtTemplateRange(t: Pick<ShiftTemplate, "startTime" | "endTime" | "crossesMidnight">): string {
  return t.crossesMidnight ? `${t.startTime} → ${t.endTime} (+1)` : `${t.startTime} → ${t.endTime}`;
}
