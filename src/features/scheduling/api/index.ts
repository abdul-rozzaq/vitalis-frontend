/**
 * Board (timeline) uchun TanStack Query hooklari.
 *
 * Barcha HTTP chaqiruvlar `shiftsApi` orqali o'tadi — bu yerda takroriy
 * axios chaqiruvlari yoki `any` tiplar bo'lmasligi kerak.
 */
import { api } from "@/shared/lib/api";
import {
  BulkAssignPayload,
  CreateShiftPayload,
  CreateTemplatePayload,
  DepartmentRef,
  GeneratePayload,
  Shift,
  ShiftTemplate,
  shiftsApi,
  UpdateShiftPayload,
  UpdateTemplatePayload,
} from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Board va shablon so'rovlari uchun umumiy invalidatsiya kaliti. */
const SHIFT_KEYS = [["board-shifts"], ["shifts"], ["shift-templates"]];

function useShiftMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const queryKey of SHIFT_KEYS) queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── So'rovlar ───────────────────────────────────────────────────────────────

export const useDepartments = () =>
  useQuery<DepartmentRef[]>({
    queryKey: ["departments"],
    queryFn: () => api.get<DepartmentRef[]>("/departments").then((r) => r.data),
  });

export const useBoardShifts = (from: string, to: string) =>
  useQuery<Shift[]>({
    queryKey: ["board-shifts", from, to],
    queryFn: () => shiftsApi.listAll({ from, to, limit: 500 }),
  });

export const useShiftTemplates = (departmentId?: string) =>
  useQuery<ShiftTemplate[]>({
    queryKey: ["shift-templates", departmentId ?? "all"],
    queryFn: () => shiftsApi.templates(departmentId ? { departmentId } : undefined),
  });

/** Smenaga biriktirish mumkin bo'lgan tibbiyot xodimlari. */
export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const useStaffMembers = () =>
  useQuery<StaffMember[]>({
    queryKey: ["staffMembers"],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>("/users");
      return data.filter((u) => u.role === "DOCTOR" || u.role === "HAMSHIRA");
    },
  });

// ─── Mutatsiyalar ────────────────────────────────────────────────────────────

export const useCreateBoardShift = () => useShiftMutation((data: CreateShiftPayload) => shiftsApi.create(data));

export const useUpdateShift = () =>
  useShiftMutation(({ id, data }: { id: string; data: UpdateShiftPayload }) => shiftsApi.update(id, data));

export const useDeleteBoardShift = () => useShiftMutation((id: string) => shiftsApi.remove(id));

export const useGenerateShifts = () => useShiftMutation((data: GeneratePayload) => shiftsApi.generate(data));

export const useBulkAssign = () => useShiftMutation((data: BulkAssignPayload) => shiftsApi.bulkAssign(data));

export const useCreateTemplate = () => useShiftMutation((data: CreateTemplatePayload) => shiftsApi.createTemplate(data));

export const useUpdateTemplate = () =>
  useShiftMutation(({ id, data }: { id: string; data: UpdateTemplatePayload }) => shiftsApi.updateTemplate(id, data));

export const useDeleteTemplate = () => useShiftMutation((id: string) => shiftsApi.removeTemplate(id));
