"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, FileText, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type PaymentFormValues = {
  patientId: string;
  departmentId: string;
  amount: number;
  method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL";
  status: "PAID" | "UNPAID";
  description?: string;
};

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface PaymentFormProps {
  initialData?: Partial<PaymentFormValues>;
  patients: PatientOption[];
  departments: DepartmentOption[];
  onSubmit: (data: PaymentFormValues) => void;
  onCancel: () => void;
}

export function PaymentForm({ initialData, patients, departments, onSubmit, onCancel }: PaymentFormProps) {
  const t = useTranslations();

  const paymentSchema = z.object({
    patientId: z.string().min(1, t("forms.selectPatient")),
    departmentId: z.string().min(1, t("forms.selectDepartment")),
    amount: z.number().positive(t("forms.amountRequired")),
    method: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PAYPAL"]),
    status: z.enum(["PAID", "UNPAID"]),
    description: z.string().optional(),
  });

  const PAYMENT_METHODS = [
    { value: "CASH", label: t("forms.methodCash") },
    { value: "CREDIT_CARD", label: t("forms.methodCreditCard") },
    { value: "DEBIT_CARD", label: t("forms.methodDebitCard") },
    { value: "PAYPAL", label: t("forms.methodPaypal") },
  ];

  const PAYMENT_STATUSES = [
    { value: "PAID", label: t("forms.statusPaid") },
    { value: "UNPAID", label: t("forms.statusUnpaid") },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: initialData || {
      method: "CASH",
      status: "UNPAID",
    },
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Patient */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" />
          {t("forms.patient")}
        </label>
        <select
          {...register("patientId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectPatientOption")}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </option>
          ))}
        </select>
        {errors.patientId && <p className="text-xs text-danger-600 font-medium">{errors.patientId.message}</p>}
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

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-500" />
          {t("forms.amount")}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">UZS</span>
          <input
            {...register("amount", { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
        </div>
        {errors.amount && <p className="text-xs text-danger-600 font-medium">{errors.amount.message}</p>}
      </div>

      {/* Payment Method + Status side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" />
            {t("forms.method")}
          </label>
          <select
            {...register("method")}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" />
            {t("forms.status")}
          </label>
          <select
            {...register("status")}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-500" />
          {t("forms.notes")}
        </label>
        <textarea
          {...register("description")}
          placeholder={t("forms.notesPlaceholder")}
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
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? t("forms.updatePayment") : t("forms.recordPayment")}
        </button>
      </div>
    </form>
  );
}
