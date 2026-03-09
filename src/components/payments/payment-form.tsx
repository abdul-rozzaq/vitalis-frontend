"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, DollarSign, FileText, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const paymentSchema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  department_id: z.string().min(1, "Please select a department"),
  amount: z.string().min(1, "Amount is required"),
  payment_method: z.enum(["CASH", "CARD", "INSURANCE", "BANK_TRANSFER"]),
  status: z.enum(["PAID", "PENDING", "CANCELLED"]),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

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

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const PAYMENT_STATUSES = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PaymentForm({ initialData, patients, departments, onSubmit, onCancel }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData || {
      payment_method: "CASH",
      status: "PENDING",
    },
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Patient */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" />
          Patient
        </label>
        <select
          {...register("patient_id")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">Select a patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </option>
          ))}
        </select>
        {errors.patient_id && <p className="text-xs text-danger-600 font-medium">{errors.patient_id.message}</p>}
      </div>

      {/* Department */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          Department
        </label>
        <select
          {...register("department_id")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">Select a department...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.department_id && <p className="text-xs text-danger-600 font-medium">{errors.department_id.message}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary-500" />
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">$</span>
          <input
            {...register("amount")}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-surface border border-border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
        </div>
        {errors.amount && <p className="text-xs text-danger-600 font-medium">{errors.amount.message}</p>}
      </div>

      {/* Payment Method + Status side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" />
            Method
          </label>
          <select
            {...register("payment_method")}
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
            Status
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
          Notes (optional)
        </label>
        <textarea
          {...register("description")}
          placeholder="Additional notes about this payment..."
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
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? "Update Payment" : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
