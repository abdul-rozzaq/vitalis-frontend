"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Building2, DollarSign, GitBranch } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is too short"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more").optional(),
});

type DepartmentFormInput = z.input<typeof departmentSchema>;
type DepartmentFormValues = z.output<typeof departmentSchema>;

interface Department {
  id: string;
  name: string;
}

interface DepartmentFormProps {
  initialData?: Partial<DepartmentFormInput>;
  departments?: Department[];
  currentId?: string;
  onSubmit: (data: DepartmentFormValues) => void;
  onCancel: () => void;
}

export function DepartmentForm({ initialData, departments = [], currentId, onSubmit, onCancel }: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormInput, any, DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
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
          <GitBranch className="w-4 h-4 text-primary-500" />
          Parent Department
        </label>
        <select
          {...register("parentId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">None (top-level)</option>
          {parentOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary-500" />
          Price
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
