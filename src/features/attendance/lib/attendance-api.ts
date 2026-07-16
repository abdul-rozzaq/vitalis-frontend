import { api } from "@/shared/lib/api";

export type AttendanceRecordStatus = "PRESENT" | "LATE" | "EARLY_LEAVE" | "LATE_AND_EARLY_LEAVE" | "ABSENT";
export type AttendanceEventStatus = "PENDING" | "MATCHED" | "UNKNOWN_EMPLOYEE" | "NO_SHIFT";

export interface AttendanceEvent {
  id: string;
  rawStatus: string;
  eventAt: string;
  status: AttendanceEventStatus;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  shiftId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
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

export const attendanceApi = {
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
