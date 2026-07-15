import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, AttendanceRecordsQuery } from "../lib/attendance-api";

export const attendanceKeys = {
  all: ["attendance"] as const,
  records: (query?: AttendanceRecordsQuery) => [...attendanceKeys.all, "records", query] as const,
  record: (id: string) => [...attendanceKeys.all, "record", id] as const,
  my: () => [...attendanceKeys.all, "my"] as const,
};

export function useAttendanceRecords(query?: AttendanceRecordsQuery) {
  return useQuery({
    queryKey: attendanceKeys.records(query),
    queryFn: () => attendanceApi.getRecords(query),
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
