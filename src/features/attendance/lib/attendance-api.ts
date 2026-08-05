import { api } from "@/shared/lib/api";

export type AttendanceRecordStatus =
  | "PRESENT"
  | "LATE"
  | "EARLY_LEAVE"
  | "LATE_AND_EARLY_LEAVE"
  | "ABSENT"
  | "MISSING_CHECKOUT"
  | "MISSING_CHECKIN";
export type AttendanceEventStatus = "PENDING" | "MATCHED" | "UNKNOWN_EMPLOYEE" | "NO_SHIFT";

export interface AttendanceEvent {
  id: string;
  rawStatus: string;
  eventAt: string;
  status: AttendanceEventStatus;
  employeeNoStr: string;
  deviceIp: string;
  picturePath?: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  shiftId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  /** Smena oynasi ichida haqiqatda ichkarida bo'lgan daqiqalar. */
  workedMinutes: number;
  absentMinutes: number;
  status: AttendanceRecordStatus;
  note: string | null;
  createdAt: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    employeeNo: string | null;
  };
  shift: {
    id: string;
    startAt: string;
    endAt: string;
    department: {
      id: string;
      name: string;
    };
  };
  events: AttendanceEvent[];
}

export interface AttendanceRecordsQuery {
  date?: string; // YYYY-MM-DD
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  userId?: string;
  shiftId?: string;
  status?: AttendanceRecordStatus;
}

export interface AttendanceEventsQuery {
  status?: AttendanceEventStatus;
  from?: string;
  to?: string;
}

export interface StaffRef {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface ShiftRef {
  id: string;
  startAt: string;
  endAt: string;
  note?: string | null;
  department: { id: string; name: string };
}

/** Guruh ichidagi bitta skan. */
export interface ScanSample {
  id: string;
  eventAt: string;
  rawStatus: string;
}

/**
 * Guruhlangan hal qilinmagan skanlar — bir xil muammo bitta yozuv.
 * Terminal ID 12 marta skanerlangan bo'lsa ham operator uchun bu bitta ish.
 */
interface ScanGroup {
  key: string;
  employeeNoStr: string;
  count: number;
  /** Amal shu event ustidan bajariladi, qolganlari birga hal bo'ladi. */
  latestEventId: string;
  firstAt: string;
  lastAt: string;
  picturePath: string | null;
  scans: ScanSample[];
}

export interface UnknownEmployeeGroup extends ScanGroup {
  deviceIp: string;
}

export interface NoShiftGroup extends ScanGroup {
  user: StaffRef | null;
  /** Backend taklif qilgan eng yaqin smena — avtomatik biriktirilmaydi. */
  suggestedShift: ShiftRef | null;
}

/** To'liqsiz yozuv — kirish yoki chiqish skani yo'q. */
export interface UnresolvedRecord {
  id: string;
  userId: string;
  shiftId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceRecordStatus;
  user: StaffRef;
  shift: ShiftRef;
}

export interface UnresolvedResponse {
  unknownEmployees: UnknownEmployeeGroup[];
  noShift: NoShiftGroup[];
  records: UnresolvedRecord[];
  /** Face ID bog'lanmagan tibbiyot xodimlari. */
  unlinkedStaff: StaffRef[];
  /** Skanlar soni emas, hal qilinishi kerak bo'lgan ISHLAR soni. */
  totals: {
    unknownEmployees: number;
    noShift: number;
    records: number;
    unlinkedStaff: number;
  };
}

export interface AdjustPayload {
  checkInAt?: string | null;
  checkOutAt?: string | null;
  reason: string;
  note?: string;
}

export const attendanceApi = {
  getUnresolved: async (): Promise<UnresolvedResponse> => {
    const res = await api.get<UnresolvedResponse>("/attendance/unresolved");
    return res.data;
  },

  linkEmployee: async (eventId: string, userId: string) => {
    const res = await api.post(`/attendance/events/${eventId}/link-user`, { userId });
    return res.data;
  },

  assignShift: async (eventId: string, shiftId: string) => {
    const res = await api.post(`/attendance/events/${eventId}/assign-shift`, { shiftId });
    return res.data;
  },

  adjustRecord: async (recordId: string, payload: AdjustPayload) => {
    const res = await api.post(`/attendance/records/${recordId}/adjust`, payload);
    return res.data;
  },

  getRecords: async (query?: AttendanceRecordsQuery): Promise<AttendanceRecord[]> => {
    const searchParams = new URLSearchParams();
    if (query?.date) searchParams.set("date", query.date);
    if (query?.from) searchParams.set("from", query.from);
    if (query?.to) searchParams.set("to", query.to);
    if (query?.userId) searchParams.set("userId", query.userId);
    if (query?.shiftId) searchParams.set("shiftId", query.shiftId);
    if (query?.status) searchParams.set("status", query.status);

    const queryString = searchParams.toString();
    const url = `/attendance/records${queryString ? `?${queryString}` : ""}`;

    const res = await api.get<AttendanceRecord[]>(url);
    return res.data;
  },

  getEvents: async (query?: AttendanceEventsQuery): Promise<AttendanceEvent[]> => {
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.from) searchParams.set("from", query.from);
    if (query?.to) searchParams.set("to", query.to);

    const queryString = searchParams.toString();
    const res = await api.get<AttendanceEvent[]>(`/attendance/events${queryString ? `?${queryString}` : ""}`);
    return res.data;
  },

  getRecord: async (id: string): Promise<AttendanceRecord> => {
    const res = await api.get<AttendanceRecord>(`/attendance/records/${id}`);
    return res.data;
  },

  patchRecord: async (id: string, note: string): Promise<AttendanceRecord> => {
    const res = await api.patch<AttendanceRecord>(`/attendance/records/${id}`, { note });
    return res.data;
  },

  getMyRecords: async (): Promise<AttendanceRecord[]> => {
    const res = await api.get<AttendanceRecord[]>("/attendance/my");
    return res.data;
  },
};
