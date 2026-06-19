"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, FlaskConical } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type DiagnosticServiceFormInput = {
  name: string;
  price?: number | string;
};

type DiagnosticServiceFormValues = {
  name: string;
  price?: number;
};

interface DiagnosticServiceFormProps {
  initialData?: Partial<DiagnosticServiceFormInput>;
  onSubmit: (data: DiagnosticServiceFormValues) => void;
  onCancel: () => void;
}

export function DiagnosticServiceForm({ initialData, onSubmit, onCancel }: DiagnosticServiceFormProps) {
  const t = useTranslations();

  const serviceSchema = z.object({
    name: z.string().min(2, t("forms.diagnosticServiceNameTooShort")),
    price: z.coerce.number().min(0, t("forms.priceMustBePositive")).optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiagnosticServiceFormInput, any, DiagnosticServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary-500" />
          {t("forms.diagnosticServiceName")}
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Qorin bo'shlig'i UZI"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

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
        {errors.price && <p className="text-xs text-danger-600 font-medium">{errors.price.message}</p>}
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
          {isEditing ? t("forms.updateDiagnosticService") : t("forms.addDiagnosticService")}
        </button>
      </div>
    </form>
  );
}
