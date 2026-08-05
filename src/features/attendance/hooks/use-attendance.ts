import { Shift, shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AdjustPayload,
  attendanceApi,
  AttendanceEventsQuery,
  AttendanceRecordsQuery,
} from "../lib/attendance-api";

/** "Kim ishda" ekrani shu davriylikda yangilanadi. */
const LIVE_POLL_MS = 30_000;

/**
 * Klinika kunining smenalari — tungi smena kechagi 22:00 da boshlangan
 * bo'lsa ham shu ro'yxatga tushadi, chunki backend filtri `endAt` bo'yicha
 * kesishishni tekshiradi.
 */
export function useLiveShifts() {
  return useQuery<Shift[]>({
    queryKey: ["live-shifts"],
    queryFn: () => {
      const today = format(new Date(), "yyyy-MM-dd");
      return shiftsApi.listAll({ from: today, to: today, limit: 500 });
    },
    refetchInterval: LIVE_POLL_MS,
  });
}

export const attendanceKeys = {
  all: ["attendance"] as const,
  records: (query?: AttendanceRecordsQuery) => [...attendanceKeys.all, "records", query] as const,
  events: (query?: AttendanceEventsQuery) => [...attendanceKeys.all, "events", query] as const,
  record: (id: string) => [...attendanceKeys.all, "record", id] as const,
  my: () => [...attendanceKeys.all, "my"] as const,
};

export function useAttendanceRecords(query?: AttendanceRecordsQuery) {
  return useQuery({
    queryKey: attendanceKeys.records(query),
    queryFn: () => attendanceApi.getRecords(query),
  });
}

export function useAttendanceEvents(query?: AttendanceEventsQuery) {
  return useQuery({
    queryKey: attendanceKeys.events(query),
    queryFn: () => attendanceApi.getEvents(query),
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: attendanceKeys.record(id),
    queryFn: () => attendanceApi.getRecord(id),
    enabled: !!id,
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: attendanceKeys.my(),
    queryFn: () => attendanceApi.getMyRecords(),
  });
}

// ─── Istisnolar navbati ──────────────────────────────────────────────────────

export function useUnresolved() {
  return useQuery({
    queryKey: [...attendanceKeys.all, "unresolved"],
    queryFn: () => attendanceApi.getUnresolved(),
    refetchInterval: LIVE_POLL_MS,
  });
}

/** Navbatdagi amallar bir xil invalidatsiyani talab qiladi. */
function useUnresolvedMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ["live-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["board-shifts"] });
    },
  });
}

export function useLinkEmployee() {
  return useUnresolvedMutation(({ eventId, userId }: { eventId: string; userId: string }) =>
    attendanceApi.linkEmployee(eventId, userId),
  );
}

export function useAssignEventToShift() {
  return useUnresolvedMutation(({ eventId, shiftId }: { eventId: string; shiftId: string }) =>
    attendanceApi.assignShift(eventId, shiftId),
  );
}

export function useAdjustRecord() {
  return useUnresolvedMutation(
    ({ recordId, payload }: { recordId: string; payload: AdjustPayload }) =>
      attendanceApi.adjustRecord(recordId, payload),
  );
}

export function useUpdateAttendanceNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      attendanceApi.patchRecord(id, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.record(variables.id) });
    },
  });
}
