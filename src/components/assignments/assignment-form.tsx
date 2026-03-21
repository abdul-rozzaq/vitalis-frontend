"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock, DoorOpen, Plus, Trash2, User } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

const scheduleRowSchema = z.object({
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
});

const assignmentSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  departmentId: z.string().min(1, "Department is required"),
  roomId: z.string().min(1, "Room is required"),
  isActive: z.boolean().default(true),
  schedules: z.array(scheduleRowSchema).optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
type AssignmentFormInput = z.input<typeof assignmentSchema>;

interface Role {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
}
interface DeptOption {
  id: string;
  name: string;
}
interface RoomOption {
  id: string;
  name: string;
}

interface AssignmentFormProps {
  initialData?: Partial<AssignmentFormValues>;
  users: UserOption[];
  departments: DeptOption[];
  rooms: RoomOption[];
  onSubmit: (data: AssignmentFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssignmentForm({ initialData, users, departments, rooms, onSubmit, onCancel, isLoading }: AssignmentFormProps) {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssignmentFormInput, unknown, AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: initialData ?? { isActive: true, schedules: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Employee */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          {t("forms.employee")}
        </label>
        <select
          {...register("userId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectEmployee")}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name} ({u.role?.name})
            </option>
          ))}
        </select>
        {errors.userId && <p className="text-xs text-danger-600 font-medium">{errors.userId.message}</p>}
      </div>

      {/* Department */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          {t("forms.department")}
        </label>
        <select
          {...register("departmentId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectDepartmentOption")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.departmentId && <p className="text-xs text-danger-600 font-medium">{errors.departmentId.message}</p>}
      </div>

      {/* Room */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-primary-500" />
          {t("forms.room")}
        </label>
        <select
          {...register("roomId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectRoom")}</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.roomId && <p className="text-xs text-danger-600 font-medium">{errors.roomId.message}</p>}
      </div>

      {/* isActive */}
      <div className="flex items-center gap-3">
        <input {...register("isActive")} type="checkbox" id="isActive" className="w-4 h-4 accent-primary-600 cursor-pointer rounded" />
        <label htmlFor="isActive" className="text-sm font-medium text-text cursor-pointer">
          {t("forms.activeAssignment")}
        </label>
      </div>

      {/* Schedules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" />
            {t("forms.weeklySchedule")}
          </label>
          <button
            type="button"
            onClick={() => append({ startTime: "09:00", endTime: "18:00" })}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            {t("forms.addSlot")}
          </button>
        </div>

        {fields.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-3 py-2 bg-background text-xs font-medium text-text-muted">
              <span>{t("forms.startTime")}</span>
              <span>{t("forms.endTime")}</span>
              <span />
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_32px] gap-2 px-3 py-2 items-center border-t border-border">
                <input
                  {...register(`schedules.${idx}.startTime`)}
                  type="time"
                  className="bg-surface border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  {...register(`schedules.${idx}.endTime`)}
                  type="time"
                  className="bg-surface border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button type="button" onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && (
          <p className="text-xs text-text-muted italic text-center py-2 border border-dashed border-border rounded-lg">
            {t("forms.noScheduleSlots")}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isLoading ? t("forms.saving") : isEditing ? t("forms.update") : t("forms.createAssignment")}
        </button>
      </div>
    </form>
  );
}
