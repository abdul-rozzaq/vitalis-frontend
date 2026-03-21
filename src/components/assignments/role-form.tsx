"use client";

import { useI18n } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type RoleFormValues = {
  name: string;
  description?: string;
};

interface RoleFormProps {
  initialData?: Partial<RoleFormValues>;
  onSubmit: (data: RoleFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoleForm({ initialData, onSubmit, onCancel, isLoading }: RoleFormProps) {
  const { t } = useI18n();

  const roleSchema = z.object({
    name: z.string().min(1, t("forms.roleNameRequired")),
    description: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData ?? {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          {t("forms.roleName")}
        </label>
        <input
          {...register("name")}
          placeholder="e.g. DOCTOR, NURSE, RECEPTIONIST"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          {t("forms.description")} <span className="text-text-muted font-normal">({t("forms.optional")})</span>
        </label>
        <textarea
          {...register("description")}
          placeholder={t("forms.roleDescPlaceholder")}
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
        />
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
          {isLoading ? t("forms.saving") : isEditing ? t("forms.updateRole") : t("forms.addRole")}
        </button>
      </div>
    </form>
  );
}
