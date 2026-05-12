"use client";

import { Combobox } from "@/components/ui/combobox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Link2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

type AppointmentFormValues = {
  patientId: string;
  assignmentId: string;
  dateTime: string;
};

interface SelectOption {
  id: string;
  name: string;
}

interface AssignmentOption {
  id: string;
  label: string;
}

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormValues>;
  patients: SelectOption[];
  assignments: AssignmentOption[];
  onSubmit: (data: AppointmentFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function AppointmentForm({ initialData, patients, assignments, onSubmit, onCancel, isPending }: AppointmentFormProps) {
  const t = useTranslations();

  const appointmentSchema = z.object({
    patientId: z.string().min(1, t("forms.patientRequired")),
    assignmentId: z.string().min(1, t("forms.assignmentRequired")),
    dateTime: z.string().min(1, t("forms.dateTimeRequired")),
  });

  function nowLocal() {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: { dateTime: nowLocal(), ...initialData },
  });

  const patientId = useWatch({ control, name: "patientId" });
  const assignmentId = useWatch({ control, name: "assignmentId" });

  const isEditing = !!initialData;

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: p.name,
    avatar: p.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  }));

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: a.label,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Patient */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          {t("forms.patient")}
        </label>
        <Combobox
          options={patientOptions}
          value={patientId}
          onChange={(val) => setValue("patientId", val, { shouldValidate: true })}
          placeholder={t("forms.selectPatientOption")}
          searchPlaceholder={t("common.search")}
          disabled={isPending}
          error={!!errors.patientId}
        />
        {errors.patientId && <p className="text-xs text-danger-600 font-medium">{errors.patientId.message}</p>}
      </div>

      {/* Assignment */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary-500" />
          {t("forms.assignmentDoctorDept")}
        </label>
        <Combobox
          options={assignmentOptions}
          value={assignmentId}
          onChange={(val) => setValue("assignmentId", val, { shouldValidate: true })}
          placeholder={t("forms.selectAssignment")}
          searchPlaceholder={t("common.search")}
          disabled={isPending}
          error={!!errors.assignmentId}
        />
        {errors.assignmentId && <p className="text-xs text-danger-600 font-medium">{errors.assignmentId.message}</p>}
      </div>

      {/* DateTime */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          {t("forms.dateTime")}
        </label>
        <input
          type="datetime-local"
          {...register("dateTime")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.dateTime && <p className="text-xs text-danger-600 font-medium">{errors.dateTime.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isEditing ? t("forms.updateAppointment") : t("forms.bookAppointment")}
        </button>
      </div>
    </form>
  );
}
