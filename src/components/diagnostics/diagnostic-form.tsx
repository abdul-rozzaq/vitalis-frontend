"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Stethoscope } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type DiagnosticFormValues = {
  name: string;
  description?: string;
};

interface DiagnosticFormProps {
  initialData?: Partial<DiagnosticFormValues>;
  onSubmit: (data: DiagnosticFormValues) => void;
  onCancel: () => void;
}

export function DiagnosticForm({ initialData, onSubmit, onCancel }: DiagnosticFormProps) {
  const t = useTranslations();

  const diagnosticSchema = z.object({
    name: z.string().min(2, t("forms.diagnosticNameTooShort")),
    description: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiagnosticFormValues>({
    resolver: zodResolver(diagnosticSchema) as any,
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary-500" />
          {t("forms.diagnosticName")}
        </label>
        <input
          {...register("name")}
          placeholder="e.g. UZI markazi"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          {t("forms.description")}
        </label>
        <textarea
          {...register("description")}
          placeholder={t("forms.diagnosticDescPlaceholder")}
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
          {isEditing ? t("forms.updateDiagnostic") : t("forms.addDiagnostic")}
        </button>
      </div>
    </form>
  );
}
