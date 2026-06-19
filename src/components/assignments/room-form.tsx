"use client";

import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlignLeft, BedDouble, Building2, Hash, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

type RoomFormInput = {
  name: string;
  roomType: "WARD" | "EXAMINATION" | "OPERATION" | "";
  capacity?: number | string;
  description?: string;
  departmentId?: string;
};


type RoomFormValues = {
  name: string;
  roomType: "WARD" | "EXAMINATION" | "OPERATION";
  capacity?: number;
  description?: string;
  departmentId?: string | null;
};

interface RoomFormProps {
  initialData?: Partial<RoomFormInput>;
  onSubmit: (data: RoomFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoomForm({ initialData, onSubmit, onCancel, isLoading }: RoomFormProps) {
  const t = useTranslations();

  const { data: departments = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const roomSchema = z.object({
    name: z.string().min(1, t("forms.roomNameRequired")),
    roomType: z.enum(["WARD", "EXAMINATION", "OPERATION"], { message: t("forms.roomTypeRequired") }),
    capacity: z.coerce.number().min(1, t("forms.capacityMin")).optional(),
    description: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomFormInput, any, RoomFormValues>({
    resolver: zodResolver(roomSchema) as any,
    defaultValues: initialData ?? { capacity: 1 },
  });

  const isEditing = !!initialData;
  const roomType = useWatch({ control, name: "roomType" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary-500" />
          {t("forms.roomName")}
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Room 220, Operating Room A"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary-500" />
          {t("forms.roomType")}
        </label>
        <select
          {...register("roomType")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="" disabled hidden>
            {t("forms.selectType")}
          </option>
         // YANGI:
          <option value="EXAMINATION">{t("forms.roomTypeExamination")}</option>
          <option value="WARD">{t("forms.roomTypeWard")}</option>
          <option value="OPERATION">{t("forms.roomTypeOperation")}</option>
        </select>
        {errors.roomType && <p className="text-xs text-danger-600 font-medium">{errors.roomType.message}</p>}
      </div>

      {roomType === "WARD" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-primary-500" />
              {t("forms.capacity")}
            </label>
            <input
              {...register("capacity")}
              type="number"
              min={1}
              placeholder="1"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
            {errors.capacity && <p className="text-xs text-danger-600 font-medium">{errors.capacity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" />
              {t("forms.department")} <span className="text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <select
              {...register("departmentId")}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
            >
              <option value="">{t("forms.selectDepartment")}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          {t("forms.descriptionOptional")}
        </label>
        <textarea
          {...register("description")}
          placeholder={t("forms.roomDescPlaceholder")}
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isLoading ? t("forms.saving") : isEditing ? t("forms.updateRoom") : t("forms.addRoom")}
        </button>
      </div>
    </form>
  );
}
