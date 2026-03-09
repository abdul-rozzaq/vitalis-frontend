"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Building2, User } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is too short"),
  description: z.string().optional(),
  head_name: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  initialData?: Partial<DepartmentFormValues>;
  onSubmit: (data: DepartmentFormValues) => void;
  onCancel: () => void;
}

export function DepartmentForm({ initialData, onSubmit, onCancel }: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          Department Name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Cardiology"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          Department Head
        </label>
        <input
          {...register("head_name")}
          placeholder="e.g. Dr. John Smith"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          Description
        </label>
        <textarea
          {...register("description")}
          placeholder="Brief description of this department..."
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
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? "Update Department" : "Add Department"}
        </button>
      </div>
    </form>
  );
}
