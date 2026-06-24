"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Building2, DollarSign, GitBranch } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FormError } from "@/components/ui/form-error";

type DepartmentFormInput = {
  name: string;
  description?: string;
  parentId?: string;
  price?: number | string;
};

type DepartmentFormValues = {
  name: string;
  description?: string;
  parentId?: string;
  price?: number;
};

interface Department {
  id: string;
  name: string;
}

interface DepartmentFormProps {
  initialData?: Partial<DepartmentFormInput>;
  departments?: Department[];
  currentId?: string;
  hideParent?: boolean;
  onSubmit: (data: DepartmentFormValues) => void;
  onCancel: () => void;
}

export function DepartmentForm({ initialData, departments = [], currentId, hideParent = false, onSubmit, onCancel }: DepartmentFormProps) {
  const t = useTranslations();

  const departmentSchema = z.object({
    name: z.string().min(2, t("forms.departmentNameTooShort")),
    description: z.string().optional(),
    parentId: z.string().optional(),
    price: z.coerce.number().min(0, t("forms.priceMustBePositive")).optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormInput, any, DepartmentFormValues>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;

  // exclude self from parent options
  const parentOptions = departments.filter((d) => d.id !== currentId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          {t("forms.departmentName")}
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Cardiology"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <FormError message={errors.name?.message} />
      </div>

      {!hideParent && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary-500" />
            {t("forms.parentDepartment")}
          </label>
          <select
            {...register("parentId")}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
          >
            <option value="">{t("forms.noneTopLevel")}</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary-500" />
          {t("forms.price")}
        </label>
        <input
          {...register("price")}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <FormError message={errors.price?.message} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          {t("forms.description")}
        </label>
        <textarea
          {...register("description")}
          placeholder={t("forms.departmentDescPlaceholder")}
          rows={4}
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
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? t("forms.updateDepartment") : t("forms.addDepartment")}
        </button>
      </div>
    </form>
  );
}
