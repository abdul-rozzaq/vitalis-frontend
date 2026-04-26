"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock, DoorOpen, Plus, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Combobox, ComboboxOption } from "../ui/combobox";

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

interface Role { id: string; name: string; }
interface UserOption { id: string; first_name: string; last_name: string; role: Role; }
interface DeptOption {
  id: string;
  name: string;
  price?: number | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
}
interface RoomOption { id: string; name: string; }

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

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AssignmentFormInput, unknown, AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: initialData ?? { isActive: true, schedules: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });
  const isEditing = !!initialData;

  const userOptions: ComboboxOption[] = users.map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name}`,
    sublabel: u.role?.name,
    avatar: `${u.first_name[0] ?? ""}${u.last_name[0] ?? ""}`.toUpperCase(),
  }));

  const departmentOptions: ComboboxOption[] = useMemo(() => {
    const parents = departments.filter((d) => !d.parentId);
    const children = departments.filter((d) => !!d.parentId);
    const result: ComboboxOption[] = [];

    for (const parent of parents) {
      result.push({
        value: parent.id,
        label: parent.name,
        sublabel: parent.price != null ? `${parent.price.toLocaleString()} UZS` : undefined,
      });

      const kids = children.filter((c) => c.parentId === parent.id);
      for (const child of kids) {
        result.push({
          value: child.id,
          label: child.name,
          sublabel: child.price != null
            ? `${parent.name}  ·  ${child.price.toLocaleString()} UZS`
            : parent.name,
          indent: true,
        });
      }
    }

    return result;
  }, [departments]);

  const roomOptions: ComboboxOption[] = rooms.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          {t("forms.employee")}
        </label>
        <Combobox
          options={userOptions}
          value={watch("userId")}
          onChange={(val) => setValue("userId", val, { shouldValidate: true })}
          placeholder={t("forms.selectEmployee")}
          searchPlaceholder={t("common.search")}
          disabled={isLoading}
          error={!!errors.userId}
        />
        {errors.userId && <p className="text-xs text-danger-600 font-medium">{errors.userId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          {t("forms.department")}
        </label>
        <Combobox
          options={departmentOptions}
          value={watch("departmentId")}
          onChange={(val) => setValue("departmentId", val, { shouldValidate: true })}
          placeholder={t("forms.selectDepartmentOption")}
          searchPlaceholder={t("common.search")}
          disabled={isLoading}
          error={!!errors.departmentId}
        />
        {errors.departmentId && <p className="text-xs text-danger-600 font-medium">{errors.departmentId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-primary-500" />
          {t("forms.room")}
        </label>
        <Combobox
          options={roomOptions}
          value={watch("roomId")}
          onChange={(val) => setValue("roomId", val, { shouldValidate: true })}
          placeholder={t("forms.selectRoom")}
          searchPlaceholder={t("common.search")}
          disabled={isLoading}
          error={!!errors.roomId}
        />
        {errors.roomId && <p className="text-xs text-danger-600 font-medium">{errors.roomId.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input {...register("isActive")} type="checkbox" id="isActive" className="w-4 h-4 accent-primary-600 cursor-pointer rounded" />
        <label htmlFor="isActive" className="text-sm font-medium text-text cursor-pointer">
          {t("forms.activeAssignment")}
        </label>
      </div>

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
                <input {...register(`schedules.${idx}.startTime`)} type="time" className="bg-surface border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent" />
                <input {...register(`schedules.${idx}.endTime`)} type="time" className="bg-surface border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent" />
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
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer">
          {isLoading ? t("forms.saving") : isEditing ? t("forms.update") : t("forms.createAssignment")}
        </button>
      </div>
    </form>
  );
}